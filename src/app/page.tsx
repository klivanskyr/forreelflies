import { ButtonLink } from "@/Components/Links";
import { Slider } from "@/Components/Slider";

export default function Home() {
  return (
    <div>
      <h1>Hello world</h1>
      <Slider>
        <div className="flex flex-col justify-center items-center text-center gap-4 px-16">
          <h2 className="text-[4rem]">Fly Tying Lessions</h2>
          <p className="text-[1.25rem]">We hold private and small group fly tying sessions</p>
          <ButtonLink className="max-w-[200px]" href="/" text="Contact Us" />
        </div>
        <div className="flex flex-col justify-center items-center text-center gap-4 px-16">
          <h2 className="text-[4rem]">OUR TIERS USE THE BEST MATERIALS</h2>
          <p className="text-[1.25rem]">We select the best tiers with the best materials, so your files last.</p>
          <ButtonLink className="max-w-[200px]" href="/" text="Shop now" />
        </div>
        <div className="flex flex-col justify-center items-center text-center gap-4 px-16">
          <h2 className="text-[4rem]">MATCH THE HATCH</h2>
          <p className="text-[1.25rem]">Make sure you have the right fly for the water you are fishing. Our tiers specialize across the United States, giving you the best advice on patterns for your next fishing adventure.</p>
          <ButtonLink className="max-w-[200px]" href="/" text="Contact Us" />
        </div>
      </Slider>
    </div>
  );
}