export const SITE = {
  name: "Vishnu Enterprises",
  tagline: "Premium Helmet Visors, Delivered.",
  description:
    "Vishnu Enterprises crafts premium helmet visors — mirror, tinted and clear — engineered for Indian riders. Fast delivery across India.",
  email: "varchswagupta011@gmail.com",
  phone: "+91 79826 94772",
  phoneDigits: "917982694772",
  whatsapp: "917982694772",
  address: {
    line1: "Johripur, North East Delhi",
    line2: "Delhi 110094",
    country: "India",
  },
  hours: "Mon – Sat · 10:00 AM – 8:00 PM",
  currency: "INR",
  upi: {
    id: "vishnuenterprises@upi", // Placeholder - user should replace with real UPI ID
    qrImage: null, // Placeholder - will use a generated QR or user-uploaded later
  },
} as const;

export const POLICY = {
  replacementDays: 4,
} as const;

export const formatPrice = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
