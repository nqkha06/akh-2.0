export const permissionCatalog = [
  {
    key: "admin.access",
    name: "Truy cập quản trị",
    description: "Cho phép truy cập khu vực admin.",
    group: "system",
  },
  {
    key: "users.read",
    name: "Xem người dùng",
    description: "Xem danh sách và chi tiết người dùng.",
    group: "users",
  },
  {
    key: "users.create",
    name: "Tạo người dùng",
    description: "Tạo tài khoản từ trang quản trị.",
    group: "users",
  },
  {
    key: "users.update",
    name: "Sửa người dùng",
    description: "Cập nhật tài khoản và phân quyền người dùng.",
    group: "users",
  },
  {
    key: "users.delete",
    name: "Xóa người dùng",
    description: "Xóa tài khoản không còn dữ liệu liên quan.",
    group: "users",
  },
  {
    key: "links.read",
    name: "Xem social link",
    description: "Xem danh sách và chi tiết social link của hệ thống.",
    group: "social-links",
  },
  {
    key: "links.update",
    name: "Sửa social link",
    description:
      "Cập nhật nội dung, trạng thái và khôi phục social link.",
    group: "social-links",
  },
  {
    key: "links.delete",
    name: "Xóa social link",
    description: "Đưa social link vào thùng rác.",
    group: "social-links",
  },
  {
    key: "monetization-levels.read",
    name: "Xem cấp độ kiếm tiền",
    description: "Xem danh sách và cấu hình cấp độ kiếm tiền.",
    group: "monetization",
  },
  {
    key: "monetization-levels.create",
    name: "Tạo cấp độ kiếm tiền",
    description: "Tạo cấp độ kiếm tiền mới.",
    group: "monetization",
  },
  {
    key: "monetization-levels.update",
    name: "Sửa cấp độ kiếm tiền",
    description: "Cập nhật route, rate và trải nghiệm quảng cáo.",
    group: "monetization",
  },
  {
    key: "monetization-levels.delete",
    name: "Xóa cấp độ kiếm tiền",
    description: "Xóa cấp độ kiếm tiền chưa được sử dụng.",
    group: "monetization",
  },
  {
    key: "payment-methods.read",
    name: "Xem phương thức thanh toán",
    description: "Xem danh mục phương thức nhận thanh toán.",
    group: "payments",
  },
  {
    key: "payment-methods.create",
    name: "Tạo phương thức thanh toán",
    description: "Tạo phương thức nhận thanh toán mới.",
    group: "payments",
  },
  {
    key: "payment-methods.update",
    name: "Sửa phương thức thanh toán",
    description: "Cập nhật phí, hạn mức và trường thông tin thanh toán.",
    group: "payments",
  },
  {
    key: "payment-methods.delete",
    name: "Xóa phương thức thanh toán",
    description: "Xóa phương thức thanh toán chưa được thành viên sử dụng.",
    group: "payments",
  },
  {
    key: "languages.read",
    name: "Xem ngôn ngữ",
    description: "Xem danh mục ngôn ngữ của hệ thống.",
    group: "localization",
  },
  {
    key: "languages.create",
    name: "Tạo ngôn ngữ",
    description: "Thêm locale nội dung mới.",
    group: "localization",
  },
  {
    key: "languages.update",
    name: "Sửa ngôn ngữ",
    description: "Cập nhật trạng thái, mặc định và thứ tự ngôn ngữ.",
    group: "localization",
  },
  {
    key: "languages.delete",
    name: "Xóa ngôn ngữ",
    description: "Xóa ngôn ngữ chưa có nội dung liên quan.",
    group: "localization",
  },
  {
    key: "roles.read",
    name: "Xem phân quyền",
    description: "Xem role và permission.",
    group: "authorization",
  },
  {
    key: "roles.create",
    name: "Tạo role",
    description: "Tạo role tùy chỉnh.",
    group: "authorization",
  },
  {
    key: "roles.update",
    name: "Sửa role",
    description: "Cập nhật role và permission của role.",
    group: "authorization",
  },
  {
    key: "roles.delete",
    name: "Xóa role",
    description: "Xóa role tùy chỉnh chưa được sử dụng.",
    group: "authorization",
  },
] as const;

export type PermissionDefinition = (typeof permissionCatalog)[number];
export type PermissionKey = PermissionDefinition["key"];
