import type {
  BioBankDetailsBlockDto,
  BioDividerBlockDto,
} from "@/lib/api-client";

export function createDividerBlock(id: string): BioDividerBlockDto {
  return {
    id,
    type: "divider",
    enabled: true,
    label: "",
    showLabel: false,
    style: "solid",
    spacing: "md",
  };
}

export function createBankDetailsBlock(id: string): BioBankDetailsBlockDto {
  return {
    id,
    type: "bank-details",
    enabled: true,
    title: "Thông tin chuyển khoản",
    bankName: "",
    accountName: "",
    accountNumber: "",
    branch: "",
    note: "",
    showCopyButton: true,
  };
}

export function hasCompleteBankDetails(block: BioBankDetailsBlockDto) {
  return Boolean(
    block.bankName.trim() &&
    block.accountName.trim() &&
    block.accountNumber.trim(),
  );
}
