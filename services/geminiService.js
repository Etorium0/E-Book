import axios from 'axios';
import { API_CONFIG } from '../config/api';

const geminiApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateSummary = async (text) => {
  try {
    // Kiểm tra và giới hạn độ dài text
    const MAX_LENGTH = 30000;
    let processedText = text;
    
    if (text.length > MAX_LENGTH) {
      processedText = text.slice(0, MAX_LENGTH);
      console.log('Text truncated to fit length limit');
    }

    const response = await geminiApi.post(
      `/${API_CONFIG.API_VERSION}/models/${API_CONFIG.MODEL_NAME}:generateContent`,
      {
        contents: [{
          parts: [{
            text: `Hãy tóm tắt tác phẩm này thành một câu chuyện ngắn gọn, (khoảng 300-500 từ), đảm bảo các yêu cầu sau:

              1. Bắt đầu bằng việc xác định chủ đề và thông điệp chính của tác phẩm.

              2. Tập trung vào các điểm then chốt của câu truyện:
              - Nhân vật chính và động lực của họ
              - Xung đột hoặc thử thách chính
              - Điểm chuyển biến quan trọng
              - Giải quyết và kết thúc của câu truyện

              3. Giữ lại các chi tiết, hình ảnh, hoặc đoạn văn đặc sắc nhất thể hiện được tinh hoa của tác phẩm gốc.

              4. Viết bằng giọng văn súc tích, mạch lạc, dễ hiểu nhưng vẫn giữ được chiều sâu và cảm xúc của tác phẩm.

              5. Kết luận bằng việc làm nổi bật ý nghĩa, thông điệp hoặc cảm xúc mà tác giả muốn truyền tải.

              Tác phẩm cần tóm tắt như sau: ${processedText}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      },
      {
        params: {
          key: API_CONFIG.GEMINI_API_KEY
        }
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Không nhận được kết quả từ API');
    }

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error in generateSummary:', error);
    throw error;
  }
};