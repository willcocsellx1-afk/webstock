import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const WA_NUMBER = "6285693161480";
export const FB_URL = "https://www.facebook.com/share/1Ey74rNDVi/";
export const FB_LOGO_URL = "https://www.facebook.com/share/1DNMWVGsG5/";

export const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export const imgSrc = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`;
};
