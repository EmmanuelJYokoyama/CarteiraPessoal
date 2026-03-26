export type SmsConfirmationInput = {
  email: string;
  code: string;
};

export type InitiateSmsInput = {
  userId: string;
  phoneNumber: string;
};

export type ResendSmsInput = {
  email: string;
};
