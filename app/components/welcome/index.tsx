'use client';
import type { FC, ReactElement } from 'react'
import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PromptConfig } from '@/types/app'
import Toast from '@/app/components/base/toast'
import Sender from '@/app/components/sender/index'
import type { VisionSettings } from '@/types/app'

export type IWelcomeProps = {
  conversationName: string
  hasSetInputs: boolean,
  promptConfig: PromptConfig
  savedInputs: Record<string, any>
  onStartChat: (inputs: Record<string, any>) => void
  onSend: (message: string) => void
  visionConfig?: VisionSettings
}

const Welcome: FC<IWelcomeProps> = ({ conversationName, hasSetInputs, promptConfig, savedInputs, onStartChat, onSend, visionConfig }) => {

  const { t } = useTranslation()
  const senderRef = useRef<any>(null)
  const [inputs, setInputs] = useState<Record<string, any>>((() => {
    if (hasSetInputs)
      return savedInputs

    const res: Record<string, any> = {}
    if (promptConfig) {
      promptConfig.prompt_variables.forEach((item) => {
        res[item.key] = ''
      })
    }
    return res
  })())

  const [faqList, setFaqList] = useState([
    '我还剩多少假期没休',
    '如何提交系统开发需求',
    '如何调阅业务档案',
    '差旅费用报销有什么要求',
  ])

  // 刷新 FAQ 列表
  const handleRefreshFaq = () => {
    setFaqList([
      '如何申请晋升？',
      '公司年假政策是什么？',
      '怎样更新个人信息？',
      '项目奖金如何发放？',
    ]);
  }

  useEffect(() => {
    if (!savedInputs) {
      const res: Record<string, any> = {}
      if (promptConfig) {
        promptConfig.prompt_variables.forEach((item) => {
          res[item.key] = ''
        })
      }
      setInputs(res)
    }
    else {
      setInputs(savedInputs)
    }
  }, [savedInputs])

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const canChat = () => {
    const inputLens = Object.values(inputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length
    const emptyInput = inputLens < promptVariablesLens || Object.entries(inputs).filter(([k, v]) => {
      const isRequired = promptConfig.prompt_variables.find(item => item.key === k)?.required ?? true
      return isRequired && v === ''
    }).length > 0
    if (emptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const handleChat = () => {
    if (!canChat())
      return

    onStartChat(inputs)
  }

  const handleFaqClick = (faq: string) => {
    if (senderRef.current) {
      senderRef.current.setQuery(faq)
      senderRef.current.handleSend()
    }
  }
  const handleSend = (message: string) => {
    onSend(message)
    handleChat()
  }

  return (
    <>
      {!hasSetInputs && (
        <div className="h-[calc(100vh_-_3rem)] bg-custom-bg bg-cover bg-center flex flex-col">
          {/* 主内容区 */}
          <main className="flex-1 mx-auto px-4 py-6">
            {/* 助手介绍卡片 */}
            <section className="flex items-center px-4 pb-4">
              <div>
                <h2 className="text-lg font-bold text-blue-50 mb-3">你好，我是海保数智助手</h2>
                <p className="text-custom-sm text-gray-500 leading-loose">
                  作为你的智能伙伴，我可以回答您任何的办公疑问，检索我司每一款产品、每一个规则制度。
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-28 h-28">
                  <img
                    src="/images/ai-avatar.png"
                    alt="数智助手"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </section>
            {/* 大家都在问区域 */}
            <section className="bg-question-bg bg-cover bg-center p-6 mb-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <img className="w-180px h-33px" src="/images/question-title.png" alt="大家都在问" />
                <button
                  onClick={handleRefreshFaq}
                  className="flex items-center gap-1 text-blue-600 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>换一批</span>
                </button>
              </div>
              <ul className="space-y-1 divide-y divide-gray-200">
                {faqList.map((faq, index) => (
                  <li
                    key={index}
                    className="flex items-center text-custom-base text-gray-700 cursor-pointer py-2"
                    onClick={() => handleFaqClick(faq)}
                  >
                    <img src="/images/li-icon.png" alt="图标" className="w-4 h-4 mr-2" />
                    {faq}
                  </li>
                ))}
              </ul>
            </section>
          </main>
          {/* Sender 组件 */}
          <Sender
            ref={senderRef}
            visionConfig={visionConfig}
            onSend={handleSend}
            isResponding={false}
            checkCanSend={() => true}
          />
        </div>
      )}
    </>
  );
};
export default React.memo(Welcome)