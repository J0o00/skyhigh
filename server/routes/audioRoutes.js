/**
 * Audio Routes
 * 
 * Handles audio upload and transcription
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudio } = require('../services/whisperService');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * POST /api/audio/transcribe
 * Transcribe uploaded audio file
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file provided'
            });
        }

        console.log(`🎤 Transcribing audio (${req.file.size} bytes)`);

        // Transcribe using Whisper
        const result = await transcribeAudio(req.file.buffer, 'webm');

        if (result.success) {
            console.log(`✅ Transcription: "${result.text}"`);
            res.json({
                success: true,
                data: {
                    text: result.text,
                    language: result.language,
                    segments: result.segments
                }
            });
        } else {
            console.error('❌ Transcription failed:', result.error);
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Audio transcription error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/audio/status
 * Check if Whisper service is available
 */
router.get('/status', async (req, res) => {
    const { checkWhisperAvailability } = require('../services/whisperService');
    const available = await checkWhisperAvailability();

    res.json({
        success: true,
        whisperAvailable: available,
        fallback: !available ? 'Web Speech API' : null
    });
});

module.exports = router;
