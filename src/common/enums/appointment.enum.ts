export enum AppointmentStatus {
    Pending = 'pending',         // Đã tạo lịch hẹn, chờ kiểm tra
    Checked = 'checked',         // Đã kiểm tra, đủ điều kiện tiêm
    Ineligible = 'ineligible',   // Không đủ điều kiện tiêm
    Vaccinated = 'vaccinated',   // Đã tiêm vaccine
    Cancelled = 'cancelled',     // Lịch hẹn bị hủy
}