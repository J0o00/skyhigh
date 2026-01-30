/**
 * Keywords Routes
 * 
 * Manages predefined keyword library for agent tagging.
 */

const express = require('express');
const router = express.Router();
const { Keyword } = require('../models');

/**
 * GET /api/keywords
 * Get all active keywords grouped by category
 */
router.get('/', async (req, res) => {
    try {
        const { category, includeInactive = false } = req.query;

        const query = {};
        if (!includeInactive) {
            query.isActive = true;
        }
        if (category) {
            query.category = category;
        }

        const keywords = await Keyword.find(query)
            .sort({ category: 1, usageCount: -1 })
            .lean();

        // Group by category
        const grouped = keywords.reduce((acc, keyword) => {
            if (!acc[keyword.category]) {
                acc[keyword.category] = [];
            }
            acc[keyword.category].push(keyword);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                keywords,
                grouped,
                categories: Object.keys(grouped)
            }
        });
    } catch (error) {
        console.error('Error fetching keywords:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/keywords/categories
 * Get list of keyword categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await Keyword.distinct('category', { isActive: true });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/keywords
 * Suggest new keyword (agent-generated)
 */
router.post('/', async (req, res) => {
    try {
        const { keyword, category, suggestedBy } = req.body;

        if (!keyword || !category) {
            return res.status(400).json({
                success: false,
                error: 'keyword and category are required'
            });
        }

        // Check if keyword already exists
        const existing = await Keyword.findOne({
            keyword: keyword.toLowerCase()
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Keyword already exists',
                existingKeyword: existing
            });
        }

        // Create as pending approval if agent-suggested
        const newKeyword = new Keyword({
            keyword: keyword.toLowerCase(),
            category,
            displayLabel: keyword,
            isAgentSuggested: !!suggestedBy,
            suggestedBy,
            approvalStatus: suggestedBy ? 'pending' : 'approved',
            weight: 0.5,
            sentimentImpact: 'neutral'
        });

        await newKeyword.save();

        res.status(201).json({
            success: true,
            data: newKeyword,
            message: suggestedBy
                ? 'Keyword suggested - pending approval'
                : 'Keyword created'
        });
    } catch (error) {
        console.error('Error creating keyword:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/keywords/:id
 * Update keyword (admin)
 */
router.put('/:id', async (req, res) => {
    try {
        const { displayLabel, category, weight, sentimentImpact, isActive, approvalStatus } = req.body;

        const keyword = await Keyword.findById(req.params.id);
        if (!keyword) {
            return res.status(404).json({ success: false, error: 'Keyword not found' });
        }

        if (displayLabel) keyword.displayLabel = displayLabel;
        if (category) keyword.category = category;
        if (weight !== undefined) keyword.weight = weight;
        if (sentimentImpact) keyword.sentimentImpact = sentimentImpact;
        if (isActive !== undefined) keyword.isActive = isActive;
        if (approvalStatus) keyword.approvalStatus = approvalStatus;

        await keyword.save();

        res.json({
            success: true,
            data: keyword
        });
    } catch (error) {
        console.error('Error updating keyword:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/keywords/:id/increment-usage
 * Increment usage count when keyword is used
 */
router.post('/:id/increment-usage', async (req, res) => {
    try {
        const keyword = await Keyword.findByIdAndUpdate(
            req.params.id,
            { $inc: { usageCount: 1 } },
            { new: true }
        );

        if (!keyword) {
            return res.status(404).json({ success: false, error: 'Keyword not found' });
        }

        res.json({
            success: true,
            data: keyword
        });
    } catch (error) {
        console.error('Error incrementing usage:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/keywords/pending
 * Get pending keyword suggestions (admin)
 */
router.get('/pending', async (req, res) => {
    try {
        const pending = await Keyword.find({ approvalStatus: 'pending' })
            .populate('suggestedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: pending
        });
    } catch (error) {
        console.error('Error fetching pending keywords:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
