/**
 * Whisper Service
 * 
 * Node.js wrapper for Whisper Python transcription service
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Python executable path (adjust if needed)
const PYTHON_CMD = process.env.PYTHON_PATH || 'python3';
const WHISPER_SCRIPT = path.join(__dirname, '../whisper-service/transcribe.py');

let whisperAvailable = null;

/**
 * Check if Whisper service is available
 */
async function checkWhisperAvailability() {
    if (whisperAvailable !== null) {
        return whisperAvailable;
    }

    try {
        // Check if Python is available
        await new Promise((resolve, reject) => {
            const process = spawn(PYTHON_CMD, ['--version']);
            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('Python not found'));
            });
            process.on('error', reject);
        });

        // Check if Whisper script exists
        await fs.access(WHISPER_SCRIPT);

        whisperAvailable = true;
        console.log('✅ Whisper service available');
        return true;
    } catch (error) {
        whisperAvailable = false;
        console.warn('⚠️ Whisper service not available:', error.message);
        console.warn('   Falling back to Web Speech API');
        return false;
    }
}

/**
 * Transcribe audio file using Whisper
 * 
 * @param {Buffer} audioBuffer - Audio data buffer
 * @param {string} format - Audio format (default: 'webm')
 * @returns {Promise<Object>} Transcription result
 */
async function transcribeAudio(audioBuffer, format = 'webm') {
    // Check availability first
    const available = await checkWhisperAvailability();
    if (!available) {
        throw new Error('Whisper service not available');
    }

    // Create temporary file for audio
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `audio_${Date.now()}.${format}`);

    try {
        // Write audio buffer to temp file
        await fs.writeFile(tempFile, audioBuffer);

        // Spawn Python process
        const result = await new Promise((resolve, reject) => {
            const pythonProcess = spawn(PYTHON_CMD, [WHISPER_SCRIPT, tempFile]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Whisper process exited with code ${code}: ${stderr}`));
                } else {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (err) {
                        reject(new Error(`Failed to parse Whisper output: ${err.message}`));
                    }
                }
            });

            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to spawn Whisper process: ${err.message}`));
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Whisper transcription timeout'));
            }, 30000);
        });

        return result;

    } finally {
        // Clean up temp file
        try {
            await fs.unlink(tempFile);
        } catch (err) {
            console.warn('Failed to delete temp file:', err.message);
        }
    }
}

/**
 * Initialize Whisper service (optional pre-load)
 */
async function initializeWhisper() {
    const available = await checkWhisperAvailability();

    if (available) {
        console.log('🎤 Whisper transcription service ready');
    } else {
        console.log('🎤 Using Web Speech API fallback');
    }

    return available;
}

module.exports = {
    transcribeAudio,
    initializeWhisper,
    checkWhisperAvailability
};
