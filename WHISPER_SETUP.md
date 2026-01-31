# Whisper Setup Guide

This guide walks you through setting up the Whisper speech-to-text service for ConversaIQ.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

### 1. Install Python (if not already installed)

**Windows:**
```powershell
# Download from python.org or use winget
winget install Python.Python.3.11
```

**Mac:**
```bash
brew install python@3.11
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

### 2. Install Whisper Dependencies

Navigate to the server directory and install Python packages:

```bash
cd server
pip install -r whisper-service/requirements.txt
```

**Note:** This will install:
- `openai-whisper` - The Whisper model
- `torch` - PyTorch (required by Whisper)
- `torchaudio` - Audio processing
- `numpy` - Numerical computing

Installation may take 5-10 minutes as PyTorch is large (~2GB).

### 3. Verify Installation

Test if Whisper is working:

```bash
cd whisper-service
python transcribe.py test.wav
```

If you see an error about missing test.wav, Whisper is installed correctly!

## Configuration

### Environment Variables

Optional environment variables in `.env`:

```env
# Whisper model to use (tiny, base, small, medium, large)
WHISPER_MODEL=tiny

# Python executable path (if not in PATH)
PYTHON_PATH=python3
```

### Model Selection

Available models:
- `tiny` - Fast, ~1GB RAM (recommended for free tier)
- `base` - Medium speed, ~1GB RAM
- `small` - Slower, better accuracy, ~2GB RAM
- `medium` - Very accurate, ~5GB RAM (requires paid hosting)

## Usage

Once installed, Whisper will automatically be used for transcription when:
1. Python is available
2. Whisper dependencies are installed
3. The server successfully loads the model

If Whisper is unavailable, the system automatically falls back to the browser's Web Speech API.

## Troubleshooting

### "Python not found"

Make sure Python is in your PATH:

```bash
python3 --version
# or
python --version
```

Set `PYTHON_PATH` in `.env` if needed:
```
PYTHON_PATH=/usr/bin/python3
```

### "torch not found" or Import Errors

Reinstall dependencies:

```bash
pip install --force-reinstall -r whisper-service/requirements.txt
```

### Slow Transcription

- Use `WHISPER_MODEL=tiny` for faster processing
- Consider upgrading server resources
- Check CPU usage during calls

### Memory Issues

Whisper-tiny needs ~1GB RAM. If you're on a constrained environment:
- Use the smallest model (tiny)
- Limit concurrent calls
- Monitor memory usage

## Deployment (Render.com)

Render will automatically detect and install Python dependencies if you have `requirements.txt`.

### Build Command

Update your build command in Render:

```bash
cd server && npm install && pip install -r whisper-service/requirements.txt
```

### Resource Requirements

- **Free Tier:** Works with tiny model (512MB RAM, may be tight)
- **Starter ($7/mo):** Comfortable with tiny/base models
- **Standard ($25/mo):** Can run small/medium models

## Testing

Test Whisper without starting the full server:

```bash
# Create a test audio file or use an existing one
python whisper-service/transcribe.py path/to/audio.wav
```

Expected output:
```json
{
  "success": true,
  "text": "transcribed text here",
  "language": "en",
  "segments": 1
}
```

## Performance Benchmarks

**Whisper-tiny on typical hardware:**
- **Transcription speed:** ~10x realtime (30s audio in ~3s)
- **Accuracy:** ~85% WER
- **Memory usage:** ~1GB RAM
- **CPU usage:** Moderate (1-2 cores)

## Fallback Behavior

The system gracefully falls back to Web Speech API if:
- Python is not installed
- Whisper packages are missing
- Model fails to load
- Transcription errors occur

This ensures calls always work, even without Whisper.

## Support

For issues or questions:
1. Check the server logs for error messages
2. Verify Python and dependencies are installed
3. Test the transcribe.py script directly
4. Ensure sufficient server resources

Happy transcribing! 🎤
