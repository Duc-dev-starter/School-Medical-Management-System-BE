export enum PostVaccinationStatus {
    NotChecked = 'not_checked',        // Chưa kiểm tra
    Healthy = 'healthy',              // Bình thường, khỏe mạnh
    MildReaction = 'mild_reaction',   // Có phản ứng nhẹ (sốt, đau nhẹ)
    SevereReaction = 'severe_reaction', // Phản ứng nghiêm trọng
    Other = 'other',                  // Khác
}

export enum PostMedicalCheckStatus {
    NotChecked = 'not_checked',        // Chưa đánh giá
    Healthy = 'healthy',               // Bình thường, khỏe mạnh
    NeedFollowUp = 'need_follow_up',   // Cần theo dõi thêm
    Sick = 'sick',                     // Phát hiện bệnh
    Other = 'other',                   // Khác
}

