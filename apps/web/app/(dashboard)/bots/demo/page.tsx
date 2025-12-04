'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BotChatWidget } from '@/components/features/bots/bot-chat-widget'
import { AutoFillInput } from '@/components/features/bots/auto-fill-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Sparkles, MessageSquare } from 'lucide-react'
import { FiCircle } from 'react-icons/fi'

export default function BotDemoPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [context, setContext] = useState('Khách hàng là Nguyễn Văn A, làm việc tại công ty ABC, địa chỉ Hà Nội')

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bot Features Demo</h1>
        <p className="text-muted-foreground">
          Trải nghiệm các tính năng AI Bot: Chat, Auto-fill, và nhiều hơn nữa
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="size-4 mr-2" />
            Chat Widget
          </TabsTrigger>
          <TabsTrigger value="autofill">
            <Sparkles className="size-4 mr-2" />
            Auto Fill
          </TabsTrigger>
          <TabsTrigger value="setup">
            <Bot className="size-4 mr-2" />
            Setup Guide
          </TabsTrigger>
        </TabsList>

        {}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat Widget</CardTitle>
              <CardDescription>
                Widget chat tích hợp AI với khả năng tìm kiếm Knowledge Base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Cách sử dụng:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Tạo bot với AI model (gemini-2.0-flash)</li>
                    <li>Liên kết Knowledge Base chứa tài liệu</li>
                    <li>Tạo function "ai_suggest" hoặc "document_access"</li>
                    <li>Nhúng widget vào trang của bạn</li>
                  </ol>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-xs font-mono">
                      {`<BotChatWidget
  botId="bot-123"
  functionId="func-456"
/>`}
                    </p>
                  </div>
                </div>
                <div>
                  <BotChatWidget
                    botId="demo-bot"
                    functionId="demo-function"
                    placeholder="Hỏi tôi bất cứ điều gì..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {}
        <TabsContent value="autofill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto Fill với AI</CardTitle>
              <CardDescription>
                Tự động điền form dựa trên context và AI suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Context (Thông tin để AI hiểu)</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Nhập thông tin về khách hàng..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <AutoFillInput
                  functionId="demo-autofill"
                  field="email"
                  context={context}
                  value={email}
                  onChange={setEmail}
                  label="Email"
                  placeholder="email@example.com"
                />

                <AutoFillInput
                  functionId="demo-autofill"
                  field="phone"
                  context={context}
                  value={phone}
                  onChange={setPhone}
                  label="Số điện thoại"
                  placeholder="0123456789"
                />

                <AutoFillInput
                  functionId="demo-autofill"
                  field="address"
                  context={context}
                  value={address}
                  onChange={setAddress}
                  label="Địa chỉ"
                  placeholder="Nhập địa chỉ..."
                  className="md:col-span-2"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Kết quả:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {email || '(chưa có)'}</p>
                  <p><strong>Phone:</strong> {phone || '(chưa có)'}</p>
                  <p><strong>Address:</strong> {address || '(chưa có)'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hướng dẫn Setup Bot</CardTitle>
              <CardDescription>
                Các bước để tạo và cấu hình bot với đầy đủ tính năng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">1. Tạo Bot</h3>
                <div className="p-4 bg-muted rounded-lg font-mono text-xs">
                  {`POST /api/v1/bots
{
  "name": "Customer Support Bot",
  "systemPrompt": "Bạn là trợ lý hỗ trợ khách hàng",
  "aiModel": "gemini-2.0-flash",
  "enableAutoLearn": true
}`}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">2. Liên kết Knowledge Base</h3>
                <div className="p-4 bg-muted rounded-lg font-mono text-xs">
                  {`POST /api/v1/bots/{botId}/knowledge-bases
{
  "knowledgeBaseId": "kb-123",
  "priority": 1,
  "ragSettings": {
    "maxResults": 5,
    "minScore": 0.7
  }
}`}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">3. Tạo Bot Function</h3>
                <div className="p-4 bg-muted rounded-lg font-mono text-xs">
                  {`POST /api/v1/bots/{botId}/functions
{
  "botId": "bot-123",
  "functionType": "ai_suggest",
  "name": "Smart Assistant",
  "isEnabled": true,
  "config": {
    "model": "gemini-2.0-flash",
    "temperature": 0.7
  }
}`}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">4. Sử dụng trong UI</h3>
                <div className="p-4 bg-muted rounded-lg font-mono text-xs">
                  {`import { BotChatWidget } from '@/components/features/bots/bot-chat-widget'

<BotChatWidget
  botId="bot-123"
  functionId="func-456"
/>`}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  💡 Lưu ý quan trọng
                </h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-2"><FiCircle className="w-1.5 h-1.5 fill-current shrink-0" /> workspaceId sẽ tự động được lấy từ user</li>
                  <li className="flex items-center gap-2"><FiCircle className="w-1.5 h-1.5 fill-current shrink-0" /> Bot cần được activate trước khi sử dụng</li>
                  <li className="flex items-center gap-2"><FiCircle className="w-1.5 h-1.5 fill-current shrink-0" /> Function phải được enable</li>
                  <li className="flex items-center gap-2"><FiCircle className="w-1.5 h-1.5 fill-current shrink-0" /> Knowledge Base phải có documents</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
