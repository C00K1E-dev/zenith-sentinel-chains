import founder_thumb_1 from "@/assets/founder-1-1.png";
import founder_thumb_2 from "@/assets/founder-1-2.png";

interface DataType {
  id: number;
  thumb: string;
  title: string;
  designasion: string;
  linkedin: string;
  twitter: string;
}

const founder_data: DataType[] = [
  {
    id: 1,
    thumb: founder_thumb_1,
    title: "Andrei Galea",
    designasion: "Founder & Core Developer",
    linkedin: "https://www.linkedin.com/in/andrei-galea-a2a8b9278/",
    twitter: "https://x.com/Andrei___G",
  },
  {
    id: 2,
    thumb: founder_thumb_2,
    title: "Darius Galea",
    designasion: "Co-Founder & Head of Growth",
    linkedin: "https://www.linkedin.com/in/darius-galea-a3072418b/",
    twitter: "https://x.com/TommyKHN?s=20"
  },
];

export default founder_data;