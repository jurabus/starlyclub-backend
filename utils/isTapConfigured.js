export const isTapConfigured = () => {
  return !!process.env.TAP_SECRET_KEY;
};
