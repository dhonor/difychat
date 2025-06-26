'use client'
import React, {
    forwardRef,
    useRef,
    useState,
    useEffect,
    useImperativeHandle
} from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import type { VisionSettings } from '@/types/app'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { TransferMethod } from '@/types/app'
import Toast from '@/app/components/base/toast'

export type ISenderProps = {
    visionConfig?: VisionSettings
    onSend: (message: string, files: any[]) => void
    isResponding?: boolean
    checkCanSend?: () => boolean
    initialQuery?: string
}

export type SenderHandle = {
    setQuery: (query: string) => void
    handleSend: (message?: string) => void
}

const Sender = forwardRef<SenderHandle, ISenderProps>(({
    visionConfig,
    onSend,
    isResponding,
    checkCanSend,
    initialQuery = '',
}, ref) => {
    const { t } = useTranslation()
    const { notify } = Toast
    const isUseInputMethod = useRef(false)
    const [query, setQuery] = useState(initialQuery)
    const queryRef = useRef(initialQuery)

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        setQuery: (newQuery: string) => {
            setQuery(newQuery)
            queryRef.current = newQuery
        },
        handleSend: (message?: string) => {
            if (message) {
                handleSend(message)
            } else {
                handleSend()
            }
        }
    }))

    const {
        files,
        onUpload,
        onRemove,
        onReUpload,
        onImageLinkLoadError,
        onImageLinkLoadSuccess,
        onClear,
    } = useImageFiles()

    const [activeMainTab, setActiveMainTab] = useState<string | null>(null)
    const [isDeepThinkActive, setIsDeepThinkActive] = useState(false)

    const mainTabs = [
        {
            label: '内部办公',
            icons: {
                default: '/images/icon-oa.png',
                active: '/images/icon-oa-active.png'
            },
            subLabels: [
                { label: 'OA问题', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
                { label: '报销问题', bgColor: 'bg-green-100', textColor: 'text-green-800' }
            ]
        },
        {
            label: '保险产品',
            icons: {
                default: '/images/icon-policy.png',
                active: '/images/icon-policy-active.png'
            },
            subLabels: [
                { label: '福多多', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
                { label: '鑫享福终身寿', bgColor: 'bg-green-100', textColor: 'text-green-800' }
            ]
        },
        {
            label: '规则制度',
            icons: {
                default: '/images/icon-rule.png',
                active: '/images/icon-rule-active.png'
            },
            subLabels: [
                { label: '考勤制度', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
                { label: '安全规范', bgColor: 'bg-green-100', textColor: 'text-green-800' }
            ]
        },
    ]

    useEffect(() => {
        setQuery(initialQuery)
        queryRef.current = initialQuery
    }, [initialQuery])

    const handleMainTabChange = (tabLabel: string) => {
        setActiveMainTab(activeMainTab === tabLabel ? null : tabLabel)
    }

    const handleContentChange = (e: any) => {
        const value = e.target.value
        setQuery(value)
        queryRef.current = value
    }

    const logError = (message: string) => {
        notify({ type: 'error', message, duration: 3000 })
    }

    const valid = (message?: string) => {
        const msg = message || queryRef.current
        if (!msg || msg.trim() === '') {
            logError(t('app.errorMessage.valueOfVarRequired'))
            return false
        }
        return true
    }

    const handleSend = (message?: string) => {
        const sendMessage = message || queryRef.current
        if (!valid(sendMessage) || (checkCanSend && !checkCanSend()))
            return

        onSend(sendMessage, files.filter(file => file.progress !== -1).map(fileItem => ({
            type: 'image',
            transfer_method: fileItem.type,
            url: fileItem.url,
            upload_file_id: fileItem.fileId,
        })))

        if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
            if (files.length)
                onClear()
            if (!isResponding) {
                setQuery('')
                queryRef.current = ''
            }
        }
    }

    const handleKeyUp = (e: any) => {
        if (e.code === 'Enter') {
            e.preventDefault()
            if (!e.shiftKey && !isUseInputMethod.current)
                handleSend()
        }
    }

    const handleKeyDown = (e: any) => {
        isUseInputMethod.current = e.nativeEvent.isComposing
        if (e.code === 'Enter' && !e.shiftKey) {
            const result = query.replace(/\n$/, '')
            setQuery(result)
            queryRef.current = result
            e.preventDefault()
        }
    }

    const handleDeepThink = () => {
        setIsDeepThinkActive(prev => !prev)
    }

    return (
        <>
            <div className={cn('absolute z-10 bottom-6 left-3.5 right-3.5')}>
                <div className='bg-white rounded-2xl shadow p-3'>
                    {
                        visionConfig?.enabled && (
                            <>
                                <div className='absolute bottom-2 left-2 flex items-center'>
                                    <ChatImageUploader
                                        settings={visionConfig}
                                        onUpload={onUpload}
                                        disabled={files.length >= visionConfig.number_limits}
                                    />
                                    <div className='mx-1 w-[1px] h-4 bg-black/5' />
                                </div>
                                <div className='pl-[52px]'>
                                    <ImageList
                                        list={files}
                                        onRemove={onRemove}
                                        onReUpload={onReUpload}
                                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                                        onImageLinkLoadError={onImageLinkLoadError}
                                    />
                                </div>
                            </>
                        )
                    }
                    {/* tab切换 */}
                    <div className="flex flex-nowrap mb-4 text-custom-base justify-between">
                        {mainTabs.map((tab) => (
                            <button
                                key={tab.label}
                                onClick={() => handleMainTabChange(tab.label)}
                                className={`h-auto flex items-center py-[2px] px-2.5 rounded-full 
              ${activeMainTab === tab.label
                                        ? `bg-blue-700 text-white`
                                        : `text-gray-700`
                                    }`}
                            >
                                <img className="w-4 h-4 mr-[6px]"
                                    src={activeMainTab === tab.label ? tab.icons.active : tab.icons.default}
                                    alt={tab.label}
                                />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {activeMainTab && (
                        <div className="flex flex-wrap text-custom-sm gap-2 mb-4 mt-2">
                            {mainTabs.find(tab => tab.label === activeMainTab)?.subLabels?.map((subLabel, index) => (
                                <span
                                    key={index}
                                    className={`px-3 py-1 rounded-lg ${subLabel.bgColor} ${subLabel.textColor} cursor-default`}
                                >
                                    {subLabel.label}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="w-full h-[1px] bg-gray-200 self-center" />
                    <Textarea
                        className={`
            block w-full px-2 pr-2 py-[7px] rounded-2xl leading-5 max-h-none text-sm text-gray-700 outline-none appearance-none resize-none
            ${visionConfig?.enabled && 'pl-12'}
          `}
                        value={query}
                        onChange={handleContentChange}
                        onKeyUp={handleKeyUp}
                        onKeyDown={handleKeyDown}
                        autoSize
                        placeholder="有什么可以帮助你的"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <button
                            className={`flex items-center text-sm px-3 py-[2px] rounded-full cursor-pointer 
            ${isDeepThinkActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                            onClick={handleDeepThink}
                        >
                            <img className='w-3 h-3 mr-1' src={`/images/react-${isDeepThinkActive ? 'active' : 'default'}.png`} alt="深度思考" />
                            深度思考
                        </button>
                        <div
                            className="w-8 h-8 cursor-pointer rounded-md"
                            onClick={() => handleSend()}
                        >
                            <img src="/images/send.png" alt="send" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
})

Sender.displayName = 'Sender'

export default React.memo(Sender)