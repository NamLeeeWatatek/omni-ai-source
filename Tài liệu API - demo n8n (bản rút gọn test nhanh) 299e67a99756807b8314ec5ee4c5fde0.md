# Tài liệu API - demo n8n (bản rút gọn test nhanh)

Chủ sở hữu: Linh Tiến

## 🎯 **1. Mục tiêu**

![*(Đây là giao diện sample cho dễ hình dung, cần design lại đơn giản để demo)*](2025-10-27_183555.png)

*(Đây là giao diện sample cho dễ hình dung, cần design lại đơn giản để demo)*

![Đây là giao diện web cơ bản đã deploy ngày 28 10 2025)](2025-10-28_153010.png)

Đây là giao diện web cơ bản đã deploy ngày 28 10 2025)

![Đây là giao diện khi team đã thêm tính năng train Ai tự học file](image.png)

Đây là giao diện khi team đã thêm tính năng train Ai tự học file

![Đây là giao diện khi team đã thêm tính năng train Ai tự học file](image%201.png)

Đây là giao diện khi team đã thêm tính năng train Ai tự học file

Xây dựng và kiểm tra **luồng thử nghiệm** giữa giao diện web và hệ thống n8n:

1. Người dùng trên web:
    - Upload **hình ảnh sản phẩm** (có thể nhiều hình),
    - Viết **mô tả ý tưởng video quảng cáo**,
    - Chọn **kênh mạng xã hội muốn đăng (Facebook, Instagram, v.v.)**.
2. Khi người dùng nhấn **Submit**, web sẽ gửi dữ liệu đó xuống **n8n** qua API webhook.
3. n8n sẽ:
    - Nhận dữ liệu,
    - Chạy workflow giả lập (hoặc thực tế nếu đã có AI/video engine),
    - Sau khi hoàn tất, trả kết quả cho web (có thể là thông báo thành công hoặc đường link video, link bài Facebook, v.v.).

---

## ⚙️ **2. Kiến trúc tổng quan**

```
[Giao diện Web]
   ↓ (POST JSON)
[Webhook n8n - video-generator-test]
   ↓
[Workflow n8n xử lý: tạo video, upload, đăng FB]
   ↓
[Respond to Webhook → trả kết quả cho Web]

```

---

## 💻 **3. Endpoint API**

**Phương thức:** `POST`

**URL:**

```
**Production**: 
https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social

Te*st: https://watacorp.app.n8n.cloud/webhook/video-ads
(Team dùng endpoint test này để test thoải mái, không tốn phí tạo video)*

```

> ⚠️ Đây là endpoint test – chưa yêu cầu xác thực hoặc token.
> 
> 
> Khi lên production, sẽ thay bằng `/api/v1/workflows/.../execute` và có bảo mật.
> 

---

## 📨 **4. Request Body**

**Định dạng:** `application/json`

### 🔹 Ví dụ:

```json
{
  "prompt": "Tạo video 15 giây giới thiệu túi xách nữ sang trọng, ánh sáng ban ngày, phong cách tự nhiên.",
  "images": [
    "https://cdn.mydomain.com/uploads/bag1.jpg",
    "https://cdn.mydomain.com/uploads/bag2.jpg"
  ],
  "platforms": ["facebook", "instagram"]
}

```

### 🔹 Giải thích các trường:

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `prompt` | string | ✅ | Mô tả cách video cần được tạo (nội dung, phong cách, thời lượng, tone màu, v.v.) |
| `images` | array[string] | ✅ | Danh sách URL hình ảnh sản phẩm (tối đa 5 hình) |
| `platforms` | array[string] | ✅ | Danh sách mạng xã hội muốn đăng video, ví dụ: `["facebook"]`, `["facebook","instagram"]` |

> 💡 Gợi ý hiển thị giao diện web:
> 
> - Có icon “+” để đính kèm nhiều hình (multi upload).
> - Có ô nhập mô tả (prompt).
> - Có checkbox chọn nền tảng đăng bài.
> - Khi gửi form → gọi API này.

---

## 📤 **5. Respond trả về từ n8n workflow**

Workflow n8n của chúng ta có 2 respond:

### **5.1. Response từ n8n khi user vừa mới submit (bỏ mục 5.1, chỉ lấy respond mục 5.2)**

n8n sẽ trả về JSON khi user vừa mới submit, n8n nhận thông tin và trả về như sau:

```json
{
  "status": "accepted",
  "message": "Yêu cầu đã được tiếp nhận, hệ thống đang tạo video...",
  "job_id": "job_{{Date.now()}}",
  "progress": {
    "stage": "processing",
    "ui_message": "Đang tạo video..."
  }
}
```

### **5.2. Response từ n8n khi workflow hoàn thành**

n8n sẽ trả về JSON khi workflow n8n chạy ✅ Thành công:

```json
{
  "status": "posted",
  "message": "Hoàn thành đăng lên mạng xã hội",
  "video_url": "{{ JSON.parse($('Get video status').item.json.data.resultJson).resultUrls[0] }}",
  "facebook_post_id":"{{ $json.id }}",
  "progress": {
    "stage": "posted",
    "ui_message": "Đã đăng lên mạng xã hội thành công"
  }
}

```

### 🧩 FE sẽ hiển thị thế này

1. Khi submit → nhận `status=accepted` → hiển thị *“Đang xử lý…”*
2. FE poll `/status?job_id=...` hoặc chờ webhook callback
3. Khi có `status=completed` → hiển thị *“Đã xử lý thành công 🎉”*

## **6. Workflow n8n – “video-generator-test”**

---

| Bước | Node | Mô tả |
| --- | --- | --- |
| 1️⃣ | **Webhook Trigger** | Nhận request từ web (URL: [https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social](https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social) |
| 2️⃣ | **Function Node (optional)** | Kiểm tra dữ liệu: có prompt và ít nhất 1 hình |
| 3️⃣ | **AI/Render Node (tạm test)** | Gọi API AI hoặc chỉ ghi log dữ liệu |
| 4️⃣ | **Post to Facebook Node (test)** | Gọi Facebook Graph API (hoặc mock API) |
| 5️⃣ | **Respond to Webhook** | Trả JSON kết quả cho web |

> Bạn có thể bật “Test Execution” trong n8n để xem input/output real-time.
> 

---

## **7. Hướng dẫn kiểm thử**

### 🔹 **Cách 1 – Test bằng Postman hoặc cURL**

```bash
curl -X POST \
  https://n8n.srv1078465.hstgr.cloud/webhook/video-generator-test \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Tạo video 15s giới thiệu túi xách nữ sang trọng, ánh sáng ban ngày, phong cách tự nhiên.",
    "images": [
      "https://cdn.mydomain.com/uploads/bag1.jpg",
      "https://cdn.mydomain.com/uploads/bag2.jpg"
    ],
    "platforms": ["facebook"]
  }'
```

Kết quả trả về:

```json
{
  "status": "success",
  "message": "Video đã được tạo thành công (test).",
}
```

---

### 🔹 **Cách 2 – Test từ frontend (JS)**

```jsx
async function submitForm() {
  const payload = {
    prompt: document.getElementById("prompt").value,
    images: [
      "https://cdn.mydomain.com/uploads/sample1.jpg",
      "https://cdn.mydomain.com/uploads/sample2.jpg"
    ],
    platforms: ["facebook"]
  }

  const res = await fetch("https://n8n.srv1078465.hstgr.cloud/webhook/video-generator-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  const data = await res.json()
  console.log("Kết quả:", data)
}
```

---

## 🔍 **8. Theo dõi workflow trong n8n và hình ảnh user upload**

Đăng nhập `https://n8n.srv1078465.hstgr.cloud`

→ Menu **Executions → video-generator-test**

Tại đây có thể xem:

- Request nhận được từ web
- Output của từng node
- Thời gian chạy, log lỗi (nếu có)
- Theo dõi hình ảnh user đã upload:
- Nếu dùng trang này để submit, thì vào đây để xem hình ảnh user upload [https://console.cloudinary.com/app/c-4ffcbc2e887a1e8c87349e572f4bb0/assets/media_library/folders/cd14d2e67d89476a08fcf0be3ee6eeadd2?view_mode=mosaic](https://console.cloudinary.com/app/c-4ffcbc2e887a1e8c87349e572f4bb0/assets/media_library/folders/cd14d2e67d89476a08fcf0be3ee6eeadd2?view_mode=mosaic)
- Nếu dùng trang demo basic [https://video.vietautomate.com/](https://video.vietautomate.com/) thì hình ảnh lưu trong thư mục Upload trên hostinger >> website video.vietautomate.com

---

## 🔒 **9. Ghi chú quan trọng**

| Mục | Ghi chú |
| --- | --- |
| **Auth** | Tạm bỏ trong giai đoạn test (no token) |
| **Upload hình** | Web chỉ cần gửi link, không gửi file binary |
| **File thật** | Nếu web cần upload ảnh thật → upload trước lên server/CDN, rồi gửi link cho n8n |
| **Kết quả giả lập** | Có thể mock link video/post để frontend hiển thị trước |
| **Facebook API** | Khi test xong, cần xác thực Facebook Graph App trước khi đăng thật |

---

## ✅ **10. Mục tiêu đạt được sau test**

- [x]  Web gửi được JSON lên n8n
- [x]  n8n nhận đúng payload
- [x]  Workflow chạy xuyên suốt
- [x]  Web nhận phản hồi và hiển thị kết quả

---

## 🚀 **11. Hướng phát triển sau khi test xong**

1. **Thêm bảo mật (Bearer Token / Basic Auth)**
2. **Thêm user_id / session_id** để log người tạo yêu cầu
3. **Thêm AI thực sự (Runway / Pika / ComfyUI)** để tạo video thật
4. **Đăng tự động lên Facebook bằng Graph API**
5. **Lưu log các request vào DB (Mongo / MySQL)**
6. **Giao diện hiển thị lịch sử video đã tạo**

---

## 🧱 **Tóm tắt vai trò**

| Thành phần | Vai trò |
| --- | --- |
| **Giao diện Web** | Gửi dữ liệu mô tả + link ảnh + kênh đăng |
| **n8n Workflow (video-generator-test)** | Nhận dữ liệu, xử lý hoặc giả lập video, trả kết quả |
| **Facebook API** | (Test) Đăng bài mẫu |
| **Người dùng test** | Xác minh quy trình hoạt động xuyên suốt |
|  |  |

## 🚀 12. DEV :

- Code link github: [https://github.com/HDung-watatek/ai-chat](https://github.com/HDung-watatek/ai-chat)
- Deploy bằng vercel ( link: [https://ai-chat-generate.vercel.app/](https://ai-chat-generate.vercel.app/) )
- .env tạo cùng cấp với folder app và trong vercel cũng phải set up env
    
    CLOUDINARY_CLOUD_NAME=db5dqxgzt
    CLOUDINARY_API_KEY=824838255835474
    CLOUDINARY_API_SECRET=gm3iPXWSoMJQ9Coj_x4jUBBZPfc
    CLOUDINARY_UPLOAD_PRESET=n8n-img2video
    
    n8n hoặc make link sẽ lưu trong localstorage cho phép chỉnh động
    

**CODING NOTES :**

- Gọi cloudinary và có folder api đóng vai trò như api site để call api : tạo,xóa,…
- 

[Tài liệu API - Tự động viết bài chuẩn SEO - Content Ai](https://www.notion.so/T-i-li-u-API-T-ng-vi-t-b-i-chu-n-SEO-Content-Ai-2a1e67a997568097849ffcd330a80091?pvs=21)

[Tài liệu API - OmniPost AI](https://www.notion.so/T-i-li-u-API-OmniPost-AI-2a7e67a9975680afac1df4ea7683715f?pvs=21)

[Chat bot - Trợ lý nội bộ](https://www.notion.so/Chat-bot-Tr-l-n-i-b-2b7e67a99756809ca132c3f0ebb78fcb?pvs=21)

[Wata Omi - version 2](https://www.notion.so/Wata-Omi-version-2-2b9e67a99756807597aaddcada660282?pvs=21)