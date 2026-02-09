/**
 * Laptop Inventory Controller
 * Manages laptop CRUD operations for admin users
 * Only ADMIN users can modify inventory
 */

import { db } from '../db/connection.js';
import { laptops } from '../db/schema/applications.js';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '../observability.js';
import { auditLogService } from '../services/auditLogAdapter.js';
import { validateLaptopCreation, validateLaptopUpdate, validateStockAdjustment } from '../services/laptopValidationService.js';

export const createLaptop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // ✅ AUTHORIZATION: Verify admin-only access
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, action: 'create_laptop', reason: 'not_admin' }, 'Unauthorized laptop creation attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can create laptops']
      });
    }

    const laptopData = req.body;

    // ✅ VALIDATION: Comprehensive laptop validation
    const validation = validateLaptopCreation(laptopData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // ✅ UNIQUENESS: Check if serial number already exists
    const existingBySerial = await db
      .select()
      .from(laptops)
      .where(eq(laptops.serialNumber, laptopData.serialNumber))
      .limit(1);

    if (existingBySerial.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Conflict',
        errors: [`Laptop with serial number "${laptopData.serialNumber}" already exists`]
      });
    }

    // ✅ CREATE: Insert laptop
    const [newLaptop] = await db
      .insert(laptops)
      .values({
        brand: laptopData.brand.trim(),
        model: laptopData.model.trim(),
        processor: laptopData.processor?.trim() || null,
        ram: laptopData.ram?.trim() || null,
        storage: laptopData.storage?.trim() || null,
        screen: laptopData.screen?.trim() || null,
        serialNumber: laptopData.serialNumber.trim(),
        originalPrice: parseFloat(laptopData.originalPrice),
        discountedPrice: parseFloat(laptopData.discountedPrice),
        stockQuantity: parseInt(laptopData.stockQuantity || 0),
        imageUrl: laptopData.imageUrl || null,
        isActive: true, // New laptops are active by default
        price: parseFloat(laptopData.discountedPrice), // For backward compatibility
      })
      .returning();

    logger.info(
      { userId, laptopId: newLaptop.id, brand: newLaptop.brand, model: newLaptop.model, serialNumber: newLaptop.serialNumber },
      'Laptop created successfully'
    );
    // ✅ AUDIT LOG: Log laptop creation
    await auditLogService.logLaptopCreation(userId, newLaptop.id, {
      brand: newLaptop.brand,
      model: newLaptop.model,
      serialNumber: newLaptop.serialNumber,
      originalPrice: newLaptop.originalPrice,
      discountedPrice: newLaptop.discountedPrice,
      stockQuantity: newLaptop.stockQuantity
    }, req.ip || req.connection?.remoteAddress).catch(err => {
      logger.warn({ err }, 'Failed to log laptop creation to audit');
    });
    res.status(201).json({
      success: true,
      message: 'Laptop created successfully',
      data: { laptop: newLaptop }
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user?.userId }, 'Error creating laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to create laptop',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/laptops
 * Get all laptops (active only for students, all for admins)
 */
export const getLaptops = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Students only see active laptops, admins see all
    const query =
      userRole === 'ADMIN'
        ? db.select().from(laptops)
        : db
            .select()
            .from(laptops)
            .where(eq(laptops.isActive, true));

    const allLaptops = await query;

    res.json({
      success: true,
      message: 'Laptops retrieved successfully',
      data: {
        laptops: allLaptops,
        total: allLaptops.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching laptops');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch laptops',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/laptops/:id
 * Get a specific laptop
 */
export const getLaptopById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    let query = db.select().from(laptops).where(eq(laptops.id, id));

    // Students can only see active laptops
    if (userRole !== 'ADMIN') {
      query = query.where(eq(laptops.isActive, true));
    }

    const [laptop] = await query.limit(1);

    if (!laptop) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
        errors: ['Laptop not found']
      });
    }

    res.json({
      success: true,
      message: 'Laptop retrieved successfully',
      data: { laptop }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch laptop',
      errors: [error.message]
    });
  }
};

/**
 * DELETE /api/laptops/:id
 * Soft delete a laptop (ADMIN ONLY)
 * Sets isActive to false instead of deleting
 */
export const deleteLaptop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Verify admin access
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can delete laptops']
      });
    }

    const [deletedLaptop] = await db
      .update(laptops)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(laptops.id, id))
      .returning();

    if (!deletedLaptop) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
        errors: ['Laptop not found']
      });
    }

    logger.info(
      { userId, laptopId: id },
      'Laptop deleted (soft delete) successfully'
    );

    res.json({
      success: true,
      message: 'Laptop deactivated successfully',
      data: { laptop: deletedLaptop }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to delete laptop',
      errors: [error.message]
    });
  }
};

/**
 * PATCH /api/laptops/:id/stock
 * Decrease stock when an application is delivered (automatic)
 * Can be called from delivery or application controller
 */
export const decreaseStock = async (laptopId, quantity = 1) => {
  try {
    const [laptop] = await db
      .select()
      .from(laptops)
      .where(eq(laptops.id, laptopId))
      .limit(1);

    if (!laptop) {
      throw new Error(`Laptop ${laptopId} not found`);
    }

    if (laptop.stockQuantity < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${laptop.stockQuantity}, Requested: ${quantity}`
      );
    }

    const [updated] = await db
      .update(laptops)
      .set({
        stockQuantity: laptop.stockQuantity - quantity,
        updatedAt: new Date()
      })
      .where(eq(laptops.id, laptopId))
      .returning();

    logger.info(
      { laptopId, quantityDecreased: quantity, newStock: updated.stockQuantity },
      'Laptop stock decreased'
    );

    return updated;
  } catch (error) {
    logger.error(
      { laptopId, quantity, err: error },
      'Error decreasing stock'
    );
    throw error;
  }
};

/**
 * GET /api/laptops/stats/low-stock
 * Get laptops with low stock (for admin dashboard)
 */
export const getLowStockLaptops = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can view inventory stats']
      });
    }

    // Get laptops with stock <= 5
    const lowStock = await db
      .select()
      .from(laptops)
      .where(and(eq(laptops.isActive, true), gt(laptops.stockQuantity, 0)))
      .limit(1);

    res.json({
      success: true,
      message: 'Low stock laptops retrieved',
      data: { laptops: lowStock }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching low stock laptops');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock laptops',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/laptops
 * Get all active laptops (authenticated users)
 */
export const getActiveLaptops = async (req, res) => {
  try {
    const activeLaptops = await db
      .select()
      .from(laptops)
      .where(eq(laptops.isActive, true));

    res.json({
      success: true,
      message: 'Active laptops retrieved',
      data: { laptops: activeLaptops }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching active laptops');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active laptops',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/laptops/admin/all
 * Get all laptops including inactive (ADMIN ONLY)
 */
export const getAllLaptops = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can view all laptops']
      });
    }

    const allLaptops = await db
      .select()
      .from(laptops)
      .orderBy(laptops.brand, laptops.model);

    res.json({
      success: true,
      message: 'All laptops retrieved',
      data: { laptops: allLaptops }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching all laptops');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all laptops',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/laptops/admin/summary
 * Get inventory summary statistics (ADMIN ONLY)
 */
export const getInventorySummary = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can view inventory summary']
      });
    }

    const allLaptops = await db.select().from(laptops);
    
    const totalLaptops = allLaptops.length;
    const activeLaptops = allLaptops.filter(l => l.isActive).length;
    const totalStock = allLaptops.reduce((sum, l) => sum + (l.stockQuantity || 0), 0);
    const totalValue = allLaptops.reduce((sum, l) => 
      sum + ((l.discountedPrice || 0) * (l.stockQuantity || 0)), 0);

    res.json({
      success: true,
      message: 'Inventory summary retrieved',
      data: {
        totalLaptops,
        activeLaptops,
        totalStock,
        totalValue
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching inventory summary');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory summary',
      errors: [error.message]
    });
  }
};

export const updateLaptop = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    // ✅ AUTHORIZATION: Verify admin-only access
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, action: 'update_laptop', reason: 'not_admin' }, 'Unauthorized laptop update attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can update laptops']
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // ✅ GET EXISTING: Load current laptop to validate updates
    const [currentLaptop] = await db
      .select()
      .from(laptops)
      .where(eq(laptops.id, id))
      .limit(1);

    if (!currentLaptop) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
        errors: ['Laptop not found']
      });
    }

    // ✅ VALIDATION: Validate update fields
    const validation = validateLaptopUpdate(updateData, currentLaptop);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // ✅ UNIQUENESS: If serial number changed, check for duplicates
    if (updateData.serialNumber && updateData.serialNumber !== currentLaptop.serialNumber) {
      const existingBySerial = await db
        .select()
        .from(laptops)
        .where(eq(laptops.serialNumber, updateData.serialNumber))
        .limit(1);

      if (existingBySerial.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: [`Serial number "${updateData.serialNumber}" is already in use`]
        });
      }
    }

    // ✅ UPDATE: Build and execute update
    const updatePayload = {};
    if (updateData.brand !== undefined) updatePayload.brand = updateData.brand.trim();
    if (updateData.model !== undefined) updatePayload.model = updateData.model.trim();
    if (updateData.processor !== undefined) updatePayload.processor = updateData.processor?.trim() || null;
    if (updateData.ram !== undefined) updatePayload.ram = updateData.ram?.trim() || null;
    if (updateData.storage !== undefined) updatePayload.storage = updateData.storage?.trim() || null;
    if (updateData.screen !== undefined) updatePayload.screen = updateData.screen?.trim() || null;
    if (updateData.serialNumber !== undefined) updatePayload.serialNumber = updateData.serialNumber.trim();
    if (updateData.originalPrice !== undefined) updatePayload.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.discountedPrice !== undefined) {
      updatePayload.discountedPrice = parseFloat(updateData.discountedPrice);
      updatePayload.price = parseFloat(updateData.discountedPrice); // For backward compatibility
    }
    if (updateData.stockQuantity !== undefined) updatePayload.stockQuantity = parseInt(updateData.stockQuantity);
    if (updateData.imageUrl !== undefined) updatePayload.imageUrl = updateData.imageUrl || null;
    updatePayload.updatedAt = new Date();

    const [updated] = await db
      .update(laptops)
      .set(updatePayload)
      .where(eq(laptops.id, id))
      .returning();

    logger.info(
      { userId, laptopId: id, changes: Object.keys(updatePayload).filter(k => k !== 'updatedAt') },
      'Laptop updated successfully'
    );

    // ✅ AUDIT LOG: Log laptop update
    const changes = Object.keys(updatePayload).filter(k => k !== 'updatedAt').reduce((acc, key) => {
      acc[key] = {
        old: currentLaptop[key],
        new: updatePayload[key]
      };
      return acc;
    }, {});

    await auditLogService.logLaptopUpdate(userId, id, changes, req.ip || req.connection?.remoteAddress).catch(err => {
      logger.warn({ err }, 'Failed to log laptop update to audit');
    });

    res.json({
      success: true,
      message: 'Laptop updated successfully',
      data: { laptop: updated }
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user?.userId }, 'Error updating laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to update laptop',
      errors: [error.message]
    });
  }
};

/**
 * DELETE /api/laptops/admin/:id
 * Deactivate laptop (soft delete) (ADMIN ONLY)
 */
export const deactivateLaptop = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can deactivate laptops']
      });
    }

    const { id } = req.params;

    const updated = await db
      .update(laptops)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(laptops.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laptop not found',
        errors: ['No laptop with this ID']
      });
    }

    const userId = req.user.userId;
    // ✅ AUDIT LOG: Log laptop deactivation
    await auditLogService.logLaptopDeactivation(userId, id, {
      brand: updated[0].brand,
      model: updated[0].model,
      serialNumber: updated[0].serialNumber
    }, req.ip || req.connection?.remoteAddress).catch(err => {
      logger.warn({ err }, 'Failed to log laptop deactivation to audit');
    });

    res.json({
      success: true,
      message: 'Laptop deactivated successfully',
      data: { laptop: updated[0] }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error deactivating laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate laptop',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/laptops/admin/:id/activate
 * Reactivate laptop (ADMIN ONLY)
 */
export const activateLaptop = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only admins can activate laptops']
      });
    }

    const { id } = req.params;

    const updated = await db
      .update(laptops)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(laptops.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laptop not found',
        errors: ['No laptop with this ID']
      });
    }

    const userId = req.user.userId;
    // ✅ AUDIT LOG: Log laptop activation
    await auditLogService.logLaptopActivation(userId, id, {
      brand: updated[0].brand,
      model: updated[0].model,
      serialNumber: updated[0].serialNumber
    }, req.ip || req.connection?.remoteAddress).catch(err => {
      logger.warn({ err }, 'Failed to log laptop activation to audit');
    });

    res.json({
      success: true,
      message: 'Laptop activated successfully',
      data: { laptop: updated[0] }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error activating laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to activate laptop',
      errors: [error.message]
    });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    // ✅ AUTHORIZATION: Verify admin-only access
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, action: 'adjust_stock', reason: 'not_admin' }, 'Unauthorized stock adjustment attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can adjust stock']
      });
    }

    const { id } = req.params;
    const { quantity, reason = 'Manual adjustment' } = req.body;

    // ✅ VALIDATION: Check required fields
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field',
        errors: ['quantity parameter is required']
      });
    }

    if (!Number.isInteger(parseInt(quantity))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
        errors: ['Quantity must be an integer']
      });
    }

    // ✅ GET EXISTING: Load current laptop
    const [currentLaptop] = await db
      .select()
      .from(laptops)
      .where(eq(laptops.id, id))
      .limit(1);

    if (!currentLaptop) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
        errors: ['Laptop not found']
      });
    }

    // ✅ VALIDATION: Validate stock adjustment
    const adjustment = parseInt(quantity);
    const stockValidation = validateStockAdjustment(currentLaptop.stockQuantity || 0, adjustment);

    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock adjustment',
        errors: [stockValidation.error]
      });
    }

    // ✅ UPDATE: Apply adjustment
    const [updated] = await db
      .update(laptops)
      .set({
        stockQuantity: stockValidation.newStock,
        updatedAt: new Date()
      })
      .where(eq(laptops.id, id))
      .returning();

    logger.info(
      {
        userId,
        laptopId: id,
        previousStock: currentLaptop.stockQuantity,
        adjustment,
        newStock: stockValidation.newStock,
        reason
      },
      'Stock adjusted successfully'
    );

    // ✅ AUDIT LOG: Log stock adjustment
    await auditLogService.logStockAdjustment(userId, id, {
      brand: updated[0].brand,
      model: updated[0].model,
      serialNumber: updated[0].serialNumber,
      previousStock: currentLaptop.stockQuantity,
      adjustment,
      newStock: stockValidation.newStock,
      reason
    }, req.ip || req.connection?.remoteAddress).catch(err => {
      logger.warn({ err }, 'Failed to log stock adjustment to audit');
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { laptop: updated }
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user?.userId }, 'Error adjusting stock');
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      errors: [error.message]
    });
  }
};
