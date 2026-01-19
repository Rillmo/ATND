type ErrorContext =
  | "signup"
  | "orgCreate"
  | "orgJoin"
  | "eventCreate"
  | "checkin"
  | "leaveOrg";

const defaultByStatus: Record<number, string> = {
  400: "입력 값을 확인해주세요.",
  401: "로그인이 필요합니다.",
  403: "권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  409: "이미 처리된 요청입니다.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

const contextOverrides: Record<ErrorContext, Partial<Record<number, string>>> = {
  signup: {
    409: "이미 가입된 이메일입니다.",
  },
  orgCreate: {
    400: "조직 이름을 확인해주세요.",
  },
  orgJoin: {
    404: "초대 코드가 올바르지 않습니다.",
    409: "이미 가입된 조직입니다.",
  },
  eventCreate: {
    400: "일정 정보를 다시 확인해주세요.",
  },
  checkin: {
    400: "출석 가능 시간이 아니거나 위치가 맞지 않습니다.",
  },
  leaveOrg: {
    400: "매니저는 위임 후 탈퇴할 수 있습니다.",
  },
};

export function getFriendlyErrorMessage(status: number, context: ErrorContext) {
  const override = contextOverrides[context][status];
  if (override) return override;
  return defaultByStatus[status] ?? defaultByStatus[500];
}
