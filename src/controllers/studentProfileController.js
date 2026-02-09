import { db } from '../db/connection.js';
import { users } from '../db/schema/users.js';
import { applications, verificationStatuses } from '../db/schema/applications.js';
import { studentProfiles, universities, studentProfileAudits } from '../db/schema/universities.js';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { logger } from '../observability.js';

const REQUIRED_FIELDS = ['fullName', 'ghanaCardRef', 'phoneNumber', 'address', 'universityId'];

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : value);

async function getProfileContext(userId) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return null;
  }

  const profileRows = await db
    .select({
      id: studentProfiles.id,
      fullName: studentProfiles.fullName,
      ghanaCardRef: studentProfiles.ghanaCardRef,
      phoneNumber: studentProfiles.phoneNumber,
      address: studentProfiles.address,
      level: studentProfiles.level,
      course: studentProfiles.course,
      profilePhotoUrl: studentProfiles.profilePhotoUrl,
      universityId: studentProfiles.universityId,
      universityName: universities.name,
      verificationStatus: studentProfiles.verificationStatus,
      verificationNotes: studentProfiles.verificationNotes,
      verificationReviewedAt: studentProfiles.verificationReviewedAt,
      createdAt: studentProfiles.createdAt,
      updatedAt: studentProfiles.updatedAt,
    })
    .from(studentProfiles)
    .leftJoin(universities, eq(studentProfiles.universityId, universities.id))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  const profile = profileRows[0] || null;

  let activeApplications = 0;
  if (profile?.id) {
    const result = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM applications WHERE student_id = ${profile.id}`
    );
    activeApplications = Number(result.rows?.[0]?.count || 0);
  }

  let identityReview = {
    ghanaCardStatus: 'PENDING',
    studentIdOrAdmissionStatus: 'PENDING',
    verifiedAt: null,
    verifiedBy: null,
    rejectionReason: profile?.verificationNotes || null,
  };

  if (profile?.id) {
    const latestVerification = await db
      .select({
        status: verificationStatuses.status,
        reviewedAt: verificationStatuses.reviewedAt,
        reviewedBy: verificationStatuses.reviewedBy,
        fraudReason: verificationStatuses.fraudReason,
      })
      .from(verificationStatuses)
      .innerJoin(applications, eq(verificationStatuses.applicationId, applications.id))
      .where(eq(applications.studentId, profile.id))
      .orderBy(desc(verificationStatuses.updatedAt))
      .limit(1);

    const ver = latestVerification?.[0];
    if (ver) {
      identityReview = {
        ghanaCardStatus: ver.status || 'PENDING',
        studentIdOrAdmissionStatus: ver.status || 'PENDING',
        verifiedAt: ver.reviewedAt || null,
        verifiedBy: ver.reviewedBy || null,
        rejectionReason: ver.fraudReason || profile?.verificationNotes || null,
      };
    }
  }

  const identityLocked = !!profile && (profile.verificationStatus === 'VERIFIED' || activeApplications > 0);

  const editableFields = {
    fullName: !identityLocked,
    ghanaCardRef: !identityLocked,
    universityId: !identityLocked,
    phoneNumber: true,
    address: true,
  };

  const auditTrail = await db
    .select({
      id: studentProfileAudits.id,
      action: studentProfileAudits.action,
      field: studentProfileAudits.field,
      oldValue: studentProfileAudits.oldValue,
      newValue: studentProfileAudits.newValue,
      createdAt: studentProfileAudits.createdAt,
    })
    .from(studentProfileAudits)
    .where(eq(studentProfileAudits.userId, userId))
    .orderBy(desc(studentProfileAudits.createdAt))
    .limit(10);

  return {
    user,
    profile,
    identityLocked,
    activeApplications,
    identityReview,
    editableFields,
    auditTrail,
  };
}

async function logProfileAudit({ userId, profileId, action, field, oldValue, newValue, req }) {
  try {
    await db.insert(studentProfileAudits).values({
      userId,
      profileId,
      action,
      field,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to write student profile audit');
  }
}

export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const context = await getProfileContext(userId);

    if (!context) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { user, profile, identityLocked, activeApplications, identityReview, editableFields, auditTrail } = context;

    res.json({
      success: true,
      data: {
        user,
        profile,
        verification: {
          status: profile?.verificationStatus || 'PENDING',
          notes: profile?.verificationNotes || null,
          reviewedAt: profile?.verificationReviewedAt || null,
          emailVerified: user.emailVerified,
          identityLocked,
          activeApplications,
        },
        identityReview,
        editableFields,
        auditTrail,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student profile');
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payload = Object.fromEntries(
      Object.entries(req.body || {}).map(([key, value]) => [key, sanitizeString(value)])
    );

    const context = await getProfileContext(userId);
    if (!context) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { user, profile, identityLocked } = context;
    const updates = {};
    const auditEntries = [];

    const validateField = (key, value) => {
      if (value === undefined) return;
      if (value === null || value === '') {
        throw new Error(`${key} cannot be empty`);
      }
    };

    // Identity fields (lockable)
    if (!identityLocked) {
      if (payload.fullName !== undefined && payload.fullName !== profile?.fullName) {
        validateField('fullName', payload.fullName);
        updates.fullName = payload.fullName;
        auditEntries.push({ field: 'fullName', oldValue: profile?.fullName, newValue: payload.fullName });
      }

      if (payload.ghanaCardRef !== undefined && payload.ghanaCardRef !== profile?.ghanaCardRef) {
        validateField('ghanaCardRef', payload.ghanaCardRef);
        updates.ghanaCardRef = payload.ghanaCardRef;
        auditEntries.push({ field: 'ghanaCardRef', oldValue: profile?.ghanaCardRef, newValue: payload.ghanaCardRef });
      }

      if (payload.universityId !== undefined && payload.universityId !== profile?.universityId) {
        validateField('universityId', payload.universityId);
        updates.universityId = payload.universityId;
        auditEntries.push({ field: 'universityId', oldValue: profile?.universityId, newValue: payload.universityId });
      }
    }

    // Contact fields (always editable)
    if (payload.phoneNumber !== undefined && payload.phoneNumber !== profile?.phoneNumber) {
      validateField('phoneNumber', payload.phoneNumber);
      updates.phoneNumber = payload.phoneNumber;
      auditEntries.push({ field: 'phoneNumber', oldValue: profile?.phoneNumber, newValue: payload.phoneNumber });
    }

    if (payload.address !== undefined && payload.address !== profile?.address) {
      validateField('address', payload.address);
      updates.address = payload.address;
      auditEntries.push({ field: 'address', oldValue: profile?.address, newValue: payload.address });
    }

    if (payload.level !== undefined && payload.level !== profile?.level) {
      updates.level = payload.level;
      auditEntries.push({ field: 'level', oldValue: profile?.level, newValue: payload.level });
    }

    if (payload.course !== undefined && payload.course !== profile?.course) {
      updates.course = payload.course;
      auditEntries.push({ field: 'course', oldValue: profile?.course, newValue: payload.course });
    }

    if (payload.profilePhotoUrl !== undefined && payload.profilePhotoUrl !== profile?.profilePhotoUrl) {
      updates.profilePhotoUrl = payload.profilePhotoUrl;
      auditEntries.push({ field: 'profilePhotoUrl', oldValue: profile?.profilePhotoUrl, newValue: payload.profilePhotoUrl });
    }

    // If no profile exists yet, ensure all required fields are present
    if (!profile) {
      for (const key of REQUIRED_FIELDS) {
        validateField(key, payload[key]);
      }
    }

    // If there are no changes
    if (Object.keys(updates).length === 0 && profile) {
      const refreshed = await getProfileContext(userId);
      return res.status(200).json({ success: true, message: 'No changes detected', data: refreshed });
    }

    // Reset verification when identity changes
    const identityChanged = ['fullName', 'ghanaCardRef', 'universityId'].some((key) => updates[key] !== undefined);
    if (identityChanged) {
      updates.verificationStatus = 'PENDING';
      updates.verificationNotes = null;
      updates.verificationReviewedAt = null;
    }

    updates.updatedAt = new Date();

    let profileId = profile?.id;

    if (profile) {
      await db.update(studentProfiles).set(updates).where(eq(studentProfiles.id, profile.id));
      await logProfileAudit({
        userId,
        profileId: profile.id,
        action: 'PROFILE_UPDATED',
        field: identityChanged ? 'identity' : 'contact',
        oldValue: identityChanged ? profile.verificationStatus : undefined,
        newValue: identityChanged ? updates.verificationStatus || profile.verificationStatus : undefined,
        req,
      });
    } else {
      const [created] = await db
        .insert(studentProfiles)
        .values({
          userId,
          fullName: payload.fullName,
          ghanaCardRef: payload.ghanaCardRef,
          phoneNumber: payload.phoneNumber,
          address: payload.address,
          universityId: payload.universityId,
          verificationStatus: 'PENDING',
        })
        .returning({ id: studentProfiles.id });

      profileId = created.id;
      await logProfileAudit({ userId, profileId, action: 'PROFILE_CREATED', req });
    }

    // Keep user table in sync for contact details
    const userUpdates = {};
    if (updates.fullName && updates.fullName !== user.fullName) {
      userUpdates.fullName = updates.fullName;
    }
    if (updates.phoneNumber && updates.phoneNumber !== user.phone) {
      userUpdates.phone = updates.phoneNumber;
    }
    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = new Date();
      await db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    // Write detailed audit entries per field
    for (const entry of auditEntries) {
      await logProfileAudit({
        userId,
        profileId,
        action: 'FIELD_UPDATED',
        field: entry.field,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        req,
      });
    }

    const refreshed = await getProfileContext(userId);
    res.json({ success: true, message: 'Profile updated', data: refreshed });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update student profile');
    res.status(400).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

export const listUniversities = async (_req, res) => {
  try {
    const rows = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities)
      .orderBy(asc(universities.name));

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list universities');
    res.status(500).json({ success: false, message: 'Failed to load universities' });
  }
};
