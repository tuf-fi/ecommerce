import Hero from "@/components/sections/Hero";
import AboutSection from "@/components/sections/About";
import BestSellers from "@/components/sections/BestSellers";
import Philosophy from "@/components/sections/Philosophy";
import Moments from "@/components/sections/Moments";
import Catalogue from "@/components/sections/Catalogue";
import Journal from "@/components/sections/Journal";
import Glossary from "@/components/sections/Glossary";
import Faqs from "@/components/sections/Faq";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import Newsletter from "@/components/sections/Newsletter";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <AboutSection />

      {/* Best Sellers Section */}
      <BestSellers />

      {/* Rituals (promo split) */}
      <Moments />

      {/* Philosophy Section */}
      <Philosophy />

      {/* Shop by Concern */}
      <Glossary />

      {/* Catalogue / Shop All */}
      <Catalogue />

      {/* Journal */}
      <Journal />

      {/* FAQs */}
      <Faqs />

      {/* Testimonials */}
      <Testimonials />

      {/* Contact */}
      <Contact />

      {/* Newsletter */}
      <Newsletter />
    </>
  );
}
