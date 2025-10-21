/**
 * Analytics Dashboard Page
 * 
 * Displays comprehensive study analytics and progress tracking:
 * - Overview statistics cards
 * - Study time chart (past 30 days)
 * - Mastery progress pie chart
 * - Performance metrics
 * - Current streak tracker
 * - Activity heatmap
 * 
 * Features real-time data fetching and interactive visualizations
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface OverviewStats {
  documents: number
  flashcards: number
  reviews: number
  masteredCards: number
  totalStudyTime: number
  currentStreak: number
  longestStreak: number
}

interface StudyTimeData {
  date: string
  minutes: number
}

interface MasteryData {
  new: number
  learning: number
  familiar: number
  mastered: number
}

interface PerformanceData {
  averageQuality: string
  averageTime: number
  totalReviews: number
  accuracy: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [studyTime, setStudyTime] = useState<StudyTimeData[]>([])
  const [mastery, setMastery] = useState<MasteryData | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchAnalytics()
  }, [router])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [overviewRes, studyTimeRes, masteryRes, performanceRes] = await Promise.all([
        fetch('http://localhost:3001/api/analytics/overview', { headers }),
        fetch('http://localhost:3001/api/analytics/study-time?days=30', { headers }),
        fetch('http://localhost:3001/api/analytics/mastery-progress', { headers }),
        fetch('http://localhost:3001/api/analytics/performance?days=30', { headers }),
      ])

      const [overviewData, studyTimeData, masteryData, performanceData] = await Promise.all([
        overviewRes.json(),
        studyTimeRes.json(),
        masteryRes.json(),
        performanceRes.json(),
      ])

      setOverview(overviewData)
      setStudyTime(studyTimeData)
      setMastery(masteryData)
      setPerformance(performanceData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getMaxStudyMinutes = () => {
    return Math.max(...studyTime.map(d => d.minutes), 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <p className="text-xl text-gray-700">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const totalCards = mastery ? mastery.new + mastery.learning + mastery.familiar + mastery.mastered : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track your learning progress and performance</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Documents Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.documents || 0}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>

          {/* Flashcards Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Flashcards</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.flashcards || 0}</p>
              </div>
              <div className="text-4xl">🎴</div>
            </div>
          </div>

          {/* Reviews Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.reviews || 0}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          {/* Study Time Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Study Time</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatTime(overview?.totalStudyTime || 0)}
                </p>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>
        </div>

        {/* Streak Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔥 Current Streak</h2>
              <p className="text-5xl font-bold mb-2">{overview?.currentStreak || 0} days</p>
              <p className="text-orange-100">
                Longest: {overview?.longestStreak || 0} days
              </p>
            </div>
            <div className="text-8xl opacity-50">🔥</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Study Time Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Study Time (Last 30 Days)</h3>
            <div className="space-y-2">
              {studyTime.slice(-7).reverse().map((day, index) => {
                const maxMinutes = getMaxStudyMinutes()
                const percentage = (day.minutes / maxMinutes) * 100
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-20">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        {day.minutes > 0 && (
                          <span className="text-xs font-semibold text-white">
                            {day.minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mastery Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Mastery Progress</h3>
            <div className="space-y-4">
              {/* New Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">🆕 New</span>
                  <span className="text-sm text-gray-600">{mastery?.new || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gray-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((mastery?.new || 0) / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              {/* Learning Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">📚 Learning</span>
                  <span className="text-sm text-gray-600">{mastery?.learning || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((mastery?.learning || 0) / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              {/* Familiar Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">💡 Familiar</span>
                  <span className="text-sm text-gray-600">{mastery?.familiar || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((mastery?.familiar || 0) / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              {/* Mastered Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">⭐ Mastered</span>
                  <span className="text-sm text-gray-600">{mastery?.mastered || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((mastery?.mastered || 0) / totalCards) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">⚡ Performance Metrics (Last 30 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Accuracy */}
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {performance.accuracy}%
                </div>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
                <p className="text-xs text-gray-500 mt-1">
                  (Quality ≥ 3)
                </p>
              </div>

              {/* Average Quality */}
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {performance.averageQuality}/5
                </div>
                <p className="text-sm text-gray-600">Avg Quality</p>
                <p className="text-xs text-gray-500 mt-1">
                  Response quality
                </p>
              </div>

              {/* Average Time */}
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {performance.averageTime}s
                </div>
                <p className="text-sm text-gray-600">Avg Time/Card</p>
                <p className="text-xs text-gray-500 mt-1">
                  Per review
                </p>
              </div>

              {/* Total Reviews */}
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-600 mb-2">
                  {performance.totalReviews}
                </div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-xs text-gray-500 mt-1">
                  In period
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
