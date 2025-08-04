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
    <div className="flex flex-col gap-8 mb-2">
      <Slider>
        <Slide className="text-white" backgroundSrc={flytying.src}>
          <div className="flex flex-col justify-center items-center text-center gap-8 md:gap-12 h-full px-4">
            <h2 className="text-3xl md:text-[5rem] font-semibold">Fly Tying Lessions</h2>
            <p className="text-base md:text-[1.5rem] font-semibold">We hold private and small group fly tying sessions</p>
            <ButtonLink className="max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={flytyingmaterials.src}>
          <div className="flex flex-col justify-center items-center text-center gap-8 md:gap-12 px-4 md:px-16 h-full">
            <h2 className="text-2xl md:text-[5rem] font-semibold leading-tight md:leading-normal">OUR TIERS USE THE BEST MATERIALS</h2>
            <p className="text-base md:text-[1.5rem] font-semibold leading-tight md:leading-normal">We select the best tiers with the best materials, so your files last.</p>
            <ButtonLink className="max-w-[200px] my-2" href="/shop" text="Shop now" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={hatchtable.src}>
          <div className="flex flex-col justify-center items-center text-center gap-8 md:gap-12 px-4 md:px-16 h-full">
            <h2 className="text-3xl md:text-[5rem] font-semibold">MATCH THE HATCH</h2>
            <p className="text-base md:text-[1.5rem] font-semibold leading-tight md:leading-normal">Make sure you have the right fly for the water you are fishing. Our tiers specialize across the United States, giving you the best advice on patterns for your next fishing adventure.</p>
            <ButtonLink className="max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
        <Slide className="text-white" backgroundSrc={castingimage.src}>
          <div className="flex flex-col justify-center items-center text-center gap-8 md:gap-12 px-4 md:px-16 h-full z-5">
            <h2 className="text-3xl md:text-[5rem] font-semibold">CASTING LESSONS</h2>
            <p className="text-base md:text-[1.5rem] font-semibold">Contact us if you want casting instructions or are interested in learning anything fly fishing related!</p>
            <ButtonLink className="max-w-[200px] my-2" href="/contact" text="Contact Us" />
          </div>
        </Slide>
      </Slider>

      <div className="px-6">
        <div className="mb-8 flex flex-col gap-4 indent-3">
          <h2 className="text-3xl font-medium text-center md:text-left">TOP SELLING FLIES</h2>
          <h3 className="text-2xl mb-2 text-black text-opacity-80 text-center md:text-left">These are our top selling flies chosen by you.</h3>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : topProducts.length === 0 ? (
          <div className="text-2xl mb-2 text-black text-opacity-80 text-center py-8 min-h-[50vh]">Products coming soon!</div>
        ) : (
          <PaginatedCardList>
            {topProducts.map((product) => (
              <Card
                key={product.id}
                title={product.name}
                rating={product.reviewSummary?.averageRating || 0}
                vendorName={product.vendorName}
                price={product.price?.toFixed(2) || "0.00"}
                image={product.images?.[0]}
                product={product}
              />
            ))}
          </PaginatedCardList>
        )}
      </div>

      <div className="px-6">
        <div className="mb-8 flex flex-col gap-4 indent-3">
          <h2 className="text-3xl font-medium text-center md:text-left">OUR FLIES</h2>
          <h3 className="text-2xl mb-2 text-black text-opacity-80 text-center md:text-left">Select from our collection expertly tied flies.</h3>
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