import React, { useState } from 'react'
import { Card, Input, Button, List, Empty, Space, Spin, Pagination } from 'antd'
import { SearchOutlined, FileOutlined, DownloadOutlined } from '@ant-design/icons'
import { searchService, documentService } from '../../shared/services/documentService'
import { useI18n } from '../../shared/context/i18n'
import { truncateText } from '../../shared/utils/helpers'
import styles from './DocumentSearch.module.css'

interface SearchResult {
    id: string
    document_id: string
    title: string
    snippet: string
    relevance_score: number
}

export const DocumentSearch: React.FC = () => {
    const t = useI18n()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10

    const handleSearch = async (q: string = query, page: number = 1) => {
        if (!q.trim()) {
            setResults([])
            return
        }

        setIsLoading(true)
        try {
            const response = await searchService.search({
                query: q,
                limit: pageSize,
                offset: (page - 1) * pageSize,
            })

            setResults(response.data.results)
            setTotal(response.data.count)
            setCurrentPage(page)
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async (documentId: string) => {
        try {
            const response = await documentService.downloadDocument(documentId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'document.pdf')
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    return (
        <div className={styles.searchContainer}>
            <Card title={t.documents.cardTitle} className={styles.searchCard}>
                {/* Search bar */}
                <Space.Compact style={{ width: '100%', marginBottom: 28 }}>
                    <Input
                        size="large"
                        placeholder={t.documents.placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onPressEnter={() => handleSearch()}
                        prefix={<SearchOutlined />}
                    />
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => handleSearch(query, 1)}
                        loading={isLoading}
                    >
                        {t.documents.searchBtn}
                    </Button>
                </Space.Compact>

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                        <Spin size="large" />
                    </div>
                )}

                {results.length > 0 && (
                    <>
                        {/* Result count */}
                        <p className={styles.resultCount}>
                            {t.documents.resultCount.replace('{n}', String(total)).replace('{q}', query)}
                        </p>

                        <List
                            dataSource={results}
                            renderItem={(result) => (
                                <List.Item key={result.id}>
                                    <List.Item.Meta
                                        avatar={
                                            <div className={styles.fileIconWrap}>
                                                <FileOutlined />
                                            </div>
                                        }
                                        title={result.title}
                                        description={
                                            <div>
                                                <p className={styles.snippet}>
                                                    {truncateText(result.snippet, 150)}
                                                </p>
                                                <div className={styles.resultMeta}>
                                                    <span className={styles.relevanceTag}>
                                                        {t.documents.relevance.replace('{n}', (result.relevance_score * 100).toFixed(0))}
                                                    </span>
                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        icon={<DownloadOutlined />}
                                                        onClick={() => handleDownload(result.document_id)}
                                                    >
                                                        {t.documents.downloadBtn}
                                                    </Button>
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />

                        {total > pageSize && (
                            <div className={styles.paginationWrapper}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={total}
                                    onChange={(page) => handleSearch(query, page)}
                                />
                            </div>
                        )}
                    </>
                )}

                {query && results.length === 0 && !isLoading && (
                    <Empty description={t.documents.noResults} />
                )}
            </Card>
        </div>
    )
}