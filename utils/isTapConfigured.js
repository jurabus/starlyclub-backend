export const isTapConfigured = () => {
  return (
    !!process.env.TAP_SECRET_KEY &&
    process.env.TAP_SECRET_KEY.startsWith("sk_")
  );
};
