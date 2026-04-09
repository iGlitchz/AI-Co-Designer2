# AI Chatbot with Dual Model Support

Your chatbot now supports both **Gemini** and **Mistral** AI models!

## 🔧 Setup Instructions

### 1. Add your API keys to the `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 2. Get API keys:

**Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)
**Mistral API**: [Mistral AI Platform](https://console.mistral.ai/api-keys/)

### 3. Start the server:
```bash
npm start
```

## ✨ Features

- **Dual Model Support**: Choose between Gemini and Mistral models
- **Auto Selection**: Automatically uses the best available model if you don't specify
- **Fallback Support**: If one model fails, it tries the other  
- **Model Indicator**: Shows which AI model responded to your message
- **Smart Model Detection**: Automatically finds working models for each provider

## 🎯 Usage

1. **Auto Mode**: Let the system choose the best available model
2. **Manual Selection**: Pick specifically "Gemini" or "Mistral" from the dropdown
3. **Mixed Conversation**: Switch models mid-conversation as needed

Just add your Mistral API key to the `.env` file and you'll have both models available!