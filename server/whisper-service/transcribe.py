#!/usr/bin/env python3
"""
Whisper Transcription Service
Processes audio files using OpenAI's Whisper model
"""

import sys
import json
import whisper
import warnings
import os

# Suppress warnings
warnings.filterwarnings("ignore")

# Load model once at startup
MODEL = None

def load_model():
    """Load Whisper model (tiny for speed)"""
    global MODEL
    if MODEL is None:
        model_name = os.getenv('WHISPER_MODEL', 'tiny')
        print(f"Loading Whisper {model_name} model...", file=sys.stderr)
        MODEL = whisper.load_model(model_name)
        print("Model loaded successfully", file=sys.stderr)
    return MODEL

def transcribe_audio(audio_path):
    """
    Transcribe audio file using Whisper
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        dict: Transcription result with text and metadata
    """
    try:
        model = load_model()
        
        # Transcribe with Whisper
        result = model.transcribe(
            audio_path,
            language='en',  # Can be auto-detected by removing this
            fp16=False,  # Disable FP16 for CPU compatibility
            verbose=False
        )
        
        return {
            'success': True,
            'text': result['text'].strip(),
            'language': result.get('language', 'en'),
            'segments': len(result.get('segments', []))
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No audio file provided'
        }))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    if not os.path.exists(audio_path):
        print(json.dumps({
            'success': False,
            'error': f'Audio file not found: {audio_path}'
        }))
        sys.exit(1)
    
    # Transcribe
    result = transcribe_audio(audio_path)
    
    # Output as JSON
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)

if __name__ == '__main__':
    main()
