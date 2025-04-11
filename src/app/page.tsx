import { ButtonLink } from "@/components/Links";
import { Slider } from "@/components/Slider";
import Slide from "@/components/Slider/Slide";
import placeholder from "@/../public/placeholder.png";
import PaginatedCardList from "@/components/cards/PaginatedCardList";
import Card from "@/components/cards/RatingCard";
import Gallery from "@/components/Gallery";
import SlideLink from "@/components/Links/SlideLink";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 mb-2">
      <Slider>
        <Slide backgroundSrc={placeholder.src}>
          <div className="flex flex-col justify-center items-center text-center gap-4 h-full">
            <h2 className="text-[4rem]">Fly Tying Lessions</h2>
            <p className="text-[1.25rem]">We hold private and small group fly tying sessions</p>
            <ButtonLink className="max-w-[200px]" href="/" text="Contact Us" />
          </div>
        </Slide>
        <div className="flex flex-col justify-center items-center text-center gap-4 px-16 h-full">
          <h2 className="text-[4rem]">OUR TIERS USE THE BEST MATERIALS</h2>
          <p className="text-[1.25rem]">We select the best tiers with the best materials, so your files last.</p>
          <ButtonLink className="max-w-[200px]" href="/" text="Shop now" />
        </div>
        <div className="flex flex-col justify-center items-center text-center gap-4 px-16 h-full">
          <h2 className="text-[4rem]">MATCH THE HATCH</h2>
          <p className="text-[1.25rem]">Make sure you have the right fly for the water you are fishing. Our tiers specialize across the United States, giving you the best advice on patterns for your next fishing adventure.</p>
          <ButtonLink className="max-w-[200px]" href="/" text="Contact Us" />
        </div>
      </Slider>

      <div className="flex flex-col gap-4 p-8">
        <div className="mb-8 flex flex-col gap-4 indent-3">
          <h2 className="text-3xl font-medium">TOP SELLING FLIES</h2>
          <h3 className="text-2xl mb-2 text-black text-opacity-80">These are our top selling flies chosen by you.</h3>
        </div>
        <PaginatedCardList>
          <Card title="Fly 1" rating={3} vendorName="Billy Bob" price="10.00" />
          <Card title="Fly 2" rating={2} vendorName="Joe" price="5.00" />
          <Card title="Fly 3" rating={1} vendorName="Phil" price="2.00" />
          <Card title="Fly 4" rating={5} vendorName="Matt" price="1.50" />
          <Card title="Fly 5" rating={4} vendorName="Ryan" price="0.05" />
          <Card title="Fly 6" rating={3} vendorName="Tomas" price="0.99" />
        </PaginatedCardList>
      </div>

      <div className="flex flex-col gap-4 p-8">
        <div className="mb-8 flex flex-col gap-4 indent-3">
          <h2 className="text-3xl font-medium">OUR FLIES</h2>
          <h3 className="text-2xl mb-2 text-black text-opacity-80">Select from our collection expertly tied flies.</h3>
        </div>
        <Gallery>
            <SlideLink backgroundSrc={placeholder.src}>
              <h2 className="text-2xl font-semibold text-white">Dry Flies</h2>
            </SlideLink>
            <SlideLink backgroundSrc={placeholder.src}>
              <h2 className="text-2xl font-semibold text-white">Nymphs</h2>
            </SlideLink>
            <SlideLink backgroundSrc={placeholder.src}>
              <h2 className="text-2xl font-semibold text-white">Streamers</h2>
            </SlideLink>
            <SlideLink backgroundSrc={placeholder.src}>
              <h2 className="text-2xl font-semibold text-white">Saltwater Flies</h2>
            </SlideLink>
            <SlideLink backgroundSrc={placeholder.src}>
              <h2 className="text-2xl font-semibold text-white">Wet Flies</h2>
            </SlideLink>
        </Gallery>
      </div>
    </div>
  );
}