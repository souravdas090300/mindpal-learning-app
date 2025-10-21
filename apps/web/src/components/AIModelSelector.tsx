/**
 * AI Model Selector Component
 * 
 * Provides a dropdown interface for selecting AI models from different providers:
 * - Google Gemini (free tier)
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic Claude
 * 
 * Features:
 * - Displays available providers with icons
 * - Shows model selection per provider
 * - Indicates which providers have API keys configured
 * - Test functionality to verify provider connectivity
 * 
 * Props:
 * - selectedProvider: Currently selected provider
 * - selectedModel: Currently selected model
 * - onProviderChange: Callback when provider changes
 * - onModelChange: Callback when model changes
 */

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface AIProvider {
  id: string
  name: string
  models: string[]
  requiresKey: boolean
}

interface AIModelSelectorProps {
  selectedProvider: string
  selectedModel?: string
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
}

const PROVIDER_ICONS: Record<string, string> = {
  gemini: '🔮',
  openai: '🤖',
  claude: '🎭',
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'from-blue-500 to-purple-500',
  openai: 'from-green-500 to-teal-500',
  claude: 'from-orange-500 to-red-500',
}

export default function AIModelSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}: AIModelSelectorProps) {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProviders = async () => {
    try {
      const data = await apiClient.getAIProviders()
      setProviders(data)
      
      // Set default model if not selected
      const currentProvider = data.find(p => p.id === selectedProvider)
      if (currentProvider && !selectedModel && currentProvider.models.length > 0) {
        onModelChange(currentProvider.models[0])
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    onProviderChange(providerId)
    const provider = providers.find(p => p.id === providerId)
    if (provider && provider.models.length > 0) {
      onModelChange(provider.models[0])
    }
    setShowDropdown(false)
    setTestResult(null)
  }

  const handleTestProvider = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await apiClient.testAIProvider(selectedProvider, selectedModel)
      setTestResult(`✅ Success! Response time: ${result.responseTime}ms`)
      setTimeout(() => setTestResult(null), 5000)
    } catch (error) {
      setTestResult(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTesting(false)
    }
  }

  const currentProvider = providers.find(p => p.id === selectedProvider)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin">⏳</div>
        <span>Loading AI models...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">AI Model:</label>
        
        {/* Provider Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${
              PROVIDER_COLORS[selectedProvider] || 'from-gray-400 to-gray-600'
            } text-white rounded-lg font-semibold hover:opacity-90 transition`}
          >
            <span>{PROVIDER_ICONS[selectedProvider] || '🤖'}</span>
            <span>{currentProvider?.name || 'Unknown'}</span>
            <span className="text-xs opacity-75">
              {!currentProvider?.requiresKey && '🔓 Free'}
            </span>
            <span>▼</span>
          </button>

          {showDropdown && (
            <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              {providers.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                    provider.id === selectedProvider ? 'bg-blue-50' : ''
                  } ${providers.indexOf(provider) === 0 ? 'rounded-t-lg' : ''} ${
                    providers.indexOf(provider) === providers.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                  disabled={!provider.requiresKey}
                >
                  <div className="flex items-center gap-2">
                    <span>{PROVIDER_ICONS[provider.id]}</span>
                    <span className="font-medium text-gray-800">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {!provider.requiresKey && (
                      <span className="text-gray-400">❌ No API Key</span>
                    )}
                    {provider.requiresKey && provider.id === selectedProvider && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Selection */}
        {currentProvider && currentProvider.models.length > 1 && (
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {currentProvider.models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        )}

        {/* Test Button */}
        <button
          onClick={handleTestProvider}
          disabled={testing || !currentProvider?.requiresKey}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Test this AI model"
        >
          {testing ? '⏳ Testing...' : '🧪 Test'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`text-sm p-2 rounded ${
          testResult.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {testResult}
        </div>
      )}

      {/* Model Info */}
      {currentProvider && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>
            {currentProvider.requiresKey ? '✅' : '❌'} API Key configured
          </span>
          <span>•</span>
          <span>{currentProvider.models.length} model{currentProvider.models.length !== 1 ? 's' : ''} available</span>
        </div>
      )}
    </div>
  )
}
