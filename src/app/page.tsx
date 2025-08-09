'use client';

import { ButtonLink } from "@/components/Links";
import { Slider } from "@/components/Slider";
import Slide from "@/components/Slider/Slide";
import PaginatedCardList from "@/components/cards/PaginatedCardList";
import Card from "@/components/cards/RatingCard";
import Gallery from "@/components/Gallery";
import SlideLink from "@/components/Links/SlideLink";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import dryflyimage from "@/../public/flies/dryfly.webp";
import nymphflyimage from "@/../public/flies/nymph.webp";
import wetflyimage from "@/../public/flies/wetfly.jpg";
import streamerflyimage from "@/../public/flies/streamer.webp";
import saltwaterflyimage from "@/../public/flies/saltwaterfly.webp";

import castingimage from "@/../public/main_page/how-to-cast-a-fly-rod.jpg";
import flytying from "@/../public/main_page/flytying.jpg";
import flytyingmaterials from "@/../public/main_page/flytyingmaterials.jpg";
import hatchtable from "@/../public/main_page/hatchtable.jpg"

export default function Home() {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/v1/product/top-selling")
      .then(res => res.json())
      .then(data => {
        console.log("Top selling products API response:", data);
        setTopProducts(data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load top selling flies:", error);
        const errorMessage = "Failed to load top selling flies. Please refresh the page.";
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
      });
  }, []);
  return (
    <div className="flex flex-col gap-6 md:gap-8 mb-2 w-full max-w-full overflow-x-hidden">
      <Slider>
        <Slide className="text-white" backgroundSrc={flytying.src}>
          <div className="flex flex-col justify-center items-center text-center gap-4 md:gap-8 lg:gap-12 h-full px-2 md:px-8">
            <h2 className="text-2xl md:text-4xl lg:text-[5rem] font-semibold leading-tight">Fly Tying Lessons</h2>
            <p className="text-sm md:text-lg lg:text-[1.5rem] font-semibold leading-tight px-2">We hold private and small group fly tying sessions</p>
            <ButtonLink className="max-w-[180px] md:max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={flytyingmaterials.src}>
          <div className="flex flex-col justify-center items-center text-center gap-4 md:gap-8 lg:gap-12 px-2 md:px-16 h-full">
            <h2 className="text-xl md:text-3xl lg:text-[5rem] font-semibold leading-tight px-2">OUR TIERS USE THE BEST MATERIALS</h2>
            <p className="text-sm md:text-lg lg:text-[1.5rem] font-semibold leading-tight px-2">We select the best tiers with the best materials, so your flies last.</p>
            <ButtonLink className="max-w-[180px] md:max-w-[200px] my-2" href="/shop" text="Shop now" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={hatchtable.src}>
          <div className="flex flex-col justify-center items-center gap-4 md:gap-8 lg:gap-12 px-2 md:px-16 h-full">
            <h2 className="text-xl md:text-3xl lg:text-[5rem] font-semibold leading-tight px-2">MATCH THE HATCH</h2>
            <p className="text-center text-sm md:text-lg lg:text-[1.5rem] font-semibold leading-tight px-2">Make sure you have the right fly for the water you are fishing. Our tiers specialize across the United States, giving you the best advice on patterns for your next fishing adventure.</p>
            <ButtonLink className="max-w-[180px] md:max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={castingimage.src}>
          <div className="flex flex-col justify-center items-center text-center gap-4 md:gap-8 lg:gap-12 px-2 md:px-16 h-full z-5">
            <h2 className="text-xl md:text-3xl lg:text-[5rem] font-semibold leading-tight px-2">CASTING LESSONS</h2>
            <p className="text-sm md:text-lg lg:text-[1.5rem] font-semibold leading-tight px-2">Contact us if you want casting instructions or are interested in learning anything fly fishing related!</p>
            <ButtonLink className="max-w-[180px] md:max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
      </Slider>

      <div className="px-2 md:px-6 w-full max-w-full overflow-hidden">
        <div className="mb-4 md:mb-8 flex flex-col gap-2 md:gap-4">
          <h2 className="text-xl md:text-3xl font-medium text-center">TOP SELLING FLIES</h2>
          <h3 className="text-sm md:text-xl mb-3 md:mb-4 text-black text-opacity-80 text-center">These are our top selling flies chosen by you.</h3>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : topProducts.length === 0 ? (
          <div className="text-xl md:text-2xl mb-2 text-black text-opacity-80 text-center py-8 min-h-[50vh]">Products coming soon!</div>
        ) : (
          <div className="w-full max-w-full overflow-hidden">
            {/* Mobile Slider (no auto-slide) */}
            <div className="md:hidden">
              <Slider autoSlide={false} showDots={true} height="h-auto min-h-[600px]">
                {topProducts.map((product) => (
                  <div key={product.id} className="w-full px-4">
                    <Card
                      title={product.name}
                      rating={product.reviewSummary?.averageRating || 0}
                      vendorName={product.vendorName}
                      price={product.price?.toFixed(2) || "0.00"}
                      image={product.images?.[0]}
                      product={product}
                    />
                  </div>
                ))}
              </Slider>
            </div>
            
            {/* Desktop Paginated List */}
            <div className="hidden md:block">
              <PaginatedCardList>
                {topProducts.map((product) => {
                  return (
                    <Card
                      key={product.id}
                      title={product.name}
                      rating={product.reviewSummary?.averageRating || 0}
                      vendorName={product.vendorName}
                      price={product.price?.toFixed(2) || "0.00"}
                      image={product.images?.[0]}
                      product={product}
                    />
                  );
                })}
              </PaginatedCardList>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6">
        <div className="mb-6 md:mb-8 flex flex-col gap-3 md:gap-4 indent-3">
          <h2 className="text-2xl md:text-3xl font-medium text-center md:text-left">OUR FLIES</h2>
          <h3 className="text-lg md:text-2xl mb-2 text-black text-opacity-80 text-center md:text-left">Select from our collection expertly tied flies.</h3>
        </div>
        <Gallery>
            <SlideLink backgroundSrc={dryflyimage.src} link="/shop?category=dry-flies">
              <h2 className="text-xl md:text-2xl font-semibold text-white text-center">Dry Flies</h2>
            </SlideLink>
            <SlideLink backgroundSrc={nymphflyimage.src} link="/shop?category=nymphs">
              <h2 className="text-sm md:text-xl font-semibold text-white text-center">Nymphs</h2>
            </SlideLink>
            <SlideLink backgroundSrc={streamerflyimage.src} link="/shop?category=streamers">
              <h2 className="text-sm md:text-xl font-semibold text-white text-center">Streamers</h2>
            </SlideLink>
            <SlideLink backgroundSrc={saltwaterflyimage.src} link="/shop?category=saltwater-flies">
              <h2 className="text-sm md:text-xl font-semibold text-white text-center">Saltwater Flies</h2>
            </SlideLink>
            <SlideLink backgroundSrc={wetflyimage.src} link="/shop?category=wet-flies">
              <h2 className="text-sm md:text-xl font-semibold text-white text-center">Wet Flies</h2>
            </SlideLink>
        </Gallery>
      </div>
    </div>
  );
}