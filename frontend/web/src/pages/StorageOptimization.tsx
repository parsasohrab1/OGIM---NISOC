import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import apiClient from '../api/client'
import './StorageOptimization.css'

interface CompressionStatus {
  table_name: string
  total_size: string
  compressed_size: string
  uncompressed_size: string
  compression_ratio?: string
  total_chunks: number
  compressed_chunks: number
  uncompressed_chunks: number
  oldest_chunk_date?: string
  newest_chunk_date?: string
}

interface ChunkInfo {
  chunk_name: string
  range_start: string
  range_end: string
  is_compressed: boolean
  size: string
  size_bytes: number
}

export default function StorageOptimization() {
  const queryClient = useQueryClient()
  const [selectedTable, setSelectedTable] = useState<string>('sensor_data')
  const [compressAfterDays, setCompressAfterDays] = useState<number>(90)

  // Fetch storage stats
  const { data: storageStats, isLoading } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/storage-optimization/storage/stats')
        return response.data
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.debug('Storage service unavailable')
        }
        return { hypertables: [], summary: { total_hypertables: 0, total_chunks: 0, compressed_chunks: 0, compression_rate: 0 } }
      }
    },
    refetchInterval: 60000,
  })

  // Fetch compression status for selected table
  const { data: compressionStatus } = useQuery({
    queryKey: ['compression-status', selectedTable],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/storage-optimization/compression/status/${selectedTable}`)
        return response.data as CompressionStatus
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.debug('Compression status service unavailable')
        }
        return null
      }
    },
    enabled: !!selectedTable,
    refetchInterval: 30000,
  })

  // Fetch chunks
  const { data: chunksData } = useQuery({
    queryKey: ['chunks', selectedTable],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/storage-optimization/chunks/${selectedTable}`, {
          params: { limit: 50 }
        })
        return response.data
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.debug('Chunks service unavailable')
        }
        return { chunks: [], total: 0 }
      }
    },
    enabled: !!selectedTable,
  })

  // Enable compression mutation
  const enableCompressionMutation = useMutation({
    mutationFn: async (data: { table_name: string; compress_after_days: number }) => {
      const response = await apiClient.post('/api/storage-optimization/compression/enable', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compression-status'] })
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] })
      alert('Compression enabled successfully!')
    },
  })

  // Manual compress mutation
  const compressNowMutation = useMutation({
    mutationFn: async (data: { table_name: string; older_than_days: number }) => {
      const response = await apiClient.post('/api/storage-optimization/compression/compress-now', null, {
        params: { table_name: data.table_name, older_than_days: data.older_than_days }
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compression-status'] })
      queryClient.invalidateQueries({ queryKey: ['chunks'] })
      alert(`Compressed ${data.compressed_count} chunks successfully!`)
    },
  })

  if (isLoading) {
    return <div className="loading">Loading storage statistics...</div>
  }

  const pieData = compressionStatus ? [
    { name: 'Compressed', value: compressionStatus.compressed_chunks, color: '#28a745' },
    { name: 'Uncompressed', value: compressionStatus.uncompressed_chunks, color: '#ffc107' }
  ] : []

  const chunkSizeData = chunksData?.chunks?.slice(0, 20).map((chunk: ChunkInfo) => ({
    name: chunk.chunk_name.substring(0, 15),
    size: chunk.size_bytes / (1024 * 1024), // Convert to MB
    compressed: chunk.is_compressed ? 'Compressed' : 'Uncompressed'
  })) || []

  return (
    <div className="storage-optimization-page">
      <h2>Storage Optimization</h2>

      <div className="storage-grid">
        {/* Summary Cards */}
        <div className="storage-card summary-card">
          <h3>Storage Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-label">Total Hypertables</div>
              <div className="stat-value">{storageStats?.summary?.total_hypertables || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Chunks</div>
              <div className="stat-value">{storageStats?.summary?.total_chunks || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Compressed Chunks</div>
              <div className="stat-value">{storageStats?.summary?.compressed_chunks || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Compression Rate</div>
              <div className="stat-value">
                {(storageStats?.summary?.compression_rate || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Compression Status */}
        {compressionStatus && (
          <div className="storage-card">
            <h3>Compression Status: {compressionStatus.table_name}</h3>
            <div className="compression-info">
              <div className="info-row">
                <span>Total Size:</span>
                <strong>{compressionStatus.total_size}</strong>
              </div>
              <div className="info-row">
                <span>Compressed Size:</span>
                <strong className="compressed">{compressionStatus.compressed_size}</strong>
              </div>
              <div className="info-row">
                <span>Uncompressed Size:</span>
                <strong className="uncompressed">{compressionStatus.uncompressed_size}</strong>
              </div>
              {compressionStatus.compression_ratio && (
                <div className="info-row">
                  <span>Compression Ratio:</span>
                  <strong className="ratio">{compressionStatus.compression_ratio}</strong>
                </div>
              )}
              <div className="info-row">
                <span>Total Chunks:</span>
                <strong>{compressionStatus.total_chunks}</strong>
              </div>
              <div className="info-row">
                <span>Compressed:</span>
                <strong className="compressed">{compressionStatus.compressed_chunks}</strong>
              </div>
              <div className="info-row">
                <span>Uncompressed:</span>
                <strong className="uncompressed">{compressionStatus.uncompressed_chunks}</strong>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Compression Controls */}
        <div className="storage-card">
          <h3>Compression Management</h3>
          <div className="form-group">
            <label>Table Name</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="sensor_data">sensor_data</option>
            </select>
          </div>
          <div className="form-group">
            <label>Compress After (Days)</label>
            <input
              type="number"
              value={compressAfterDays}
              onChange={(e) => setCompressAfterDays(parseInt(e.target.value) || 90)}
              min={1}
              max={365}
            />
          </div>
          <button
            onClick={() => enableCompressionMutation.mutate({
              table_name: selectedTable,
              compress_after_days: compressAfterDays
            })}
            disabled={enableCompressionMutation.isPending}
            className="btn-enable-compression"
          >
            {enableCompressionMutation.isPending ? 'Enabling...' : 'Enable Compression Policy'}
          </button>
          <button
            onClick={() => compressNowMutation.mutate({
              table_name: selectedTable,
              older_than_days: compressAfterDays
            })}
            disabled={compressNowMutation.isPending}
            className="btn-compress-now"
          >
            {compressNowMutation.isPending ? 'Compressing...' : 'Compress Now'}
          </button>
        </div>

        {/* Chunk Statistics */}
        {chunksData && chunksData.chunks.length > 0 && (
          <div className="storage-card chart-card">
            <h3>Chunk Size Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chunkSizeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="size" fill="#8884d8" name="Size (MB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chunks List */}
        {chunksData && chunksData.chunks.length > 0 && (
          <div className="storage-card chunks-list">
            <h3>Chunks ({chunksData.total})</h3>
            <div className="chunks-table">
              <table>
                <thead>
                  <tr>
                    <th>Chunk Name</th>
                    <th>Range Start</th>
                    <th>Range End</th>
                    <th>Size</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chunksData.chunks.slice(0, 20).map((chunk: ChunkInfo) => (
                    <tr key={chunk.chunk_name}>
                      <td>{chunk.chunk_name}</td>
                      <td>{chunk.range_start ? new Date(chunk.range_start).toLocaleDateString() : '-'}</td>
                      <td>{chunk.range_end ? new Date(chunk.range_end).toLocaleDateString() : '-'}</td>
                      <td>{chunk.size}</td>
                      <td>
                        <span className={chunk.is_compressed ? 'status-compressed' : 'status-uncompressed'}>
                          {chunk.is_compressed ? '✓ Compressed' : '○ Uncompressed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

