// Fictional local workload fixtures. No statement is attached to a real college.
const HINDI = {
  'Fee Dispute': 'शुल्क और वापसी', 'Faculty Shortage': 'शिक्षकों की उपलब्धता', Infrastructure: 'परिसर की सुविधाओं',
  'Admission Irregularity': 'प्रवेश प्रक्रिया', 'Affiliation Issue': 'पाठ्यक्रम की संबद्धता', 'Placement Fraud': 'नियोजन संबंधी जानकारी',
  'Hostel Complaint': 'छात्रावास की व्यवस्था', 'Exam Irregularity': 'परीक्षा प्रक्रिया', 'Safety Concern': 'परिसर की सुरक्षा',
};
export function showcaseNarrative({ index, category, subCategory, issue, month }) {
  if (index % 10 === 0) {
    const topic = HINDI[category] || 'संस्थान की प्रक्रिया';
    return [
      `${topic} से संबंधित समस्या का समाधान नहीं हुआ है। मैंने कार्यालय को लिखित अनुरोध दिया था। विषय: ${subCategory}। कृपया दर्ज शिकायत की समीक्षा करें।`,
      `मैंने ${topic} के विषय में पहले भी संपर्क किया था, पर लिखित उत्तर नहीं मिला। विषय: ${subCategory}। अनुरोध की स्थिति और अगला कदम बताएं।`,
      `${topic} की समस्या के कारण पढ़ाई प्रभावित हो रही है। विषय: ${subCategory}। संबंधित कार्यालय से जानकारी मांगी थी; कृपया कार्रवाई का विवरण दें।`,
    ][Math.floor(index / 10) % 3];
  }
  return [
    `I am requesting a review because the institution ${issue}. I raised this with the relevant office in ${month} and am waiting for a written response.`,
    `The institution ${issue}. Our class asked the office to explain the position in ${month}. Please confirm the responsible office and the action being taken.`,
    `My concern is that the institution ${issue}. The matter was reported in ${month}, but the supporting record has not been clarified. I request a review and an update.`,
  ][index % 3];
}
