export const generateFortune = async (name: string, tableName: string): Promise<string> => {
  try {
    const response = await fetch('/api/fortune', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, tableName }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text || "新年快乐！(无内容返回)";
  } catch (error) {
    console.error("Error getting fortune:", error);
    return "新年快乐！愿你2025年好运连连！(网络错误)";
  }
};