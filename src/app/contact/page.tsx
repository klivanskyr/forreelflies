import Button from "@/Components/buttons/Button"
import Input from "@/Components/inputs/Input"
import Textarea from "@/Components/Textarea"

function Card({ symbol, title, content }: { symbol: string, title: string, content: string }) {
    return (
        <div className="p-8 shadow-card rounded-lg border w-full flex flex-col items-center justify-between">
            <p className="text-[2.5rem]">{symbol}</p>
            <div className="flex flex-col items-center justify-end" >
                <h2 className="text-xl text-opacity-50 font-medium text-black">{title}</h2>
                <h2 className="text-xl">{content}</h2>
            </div>
        </div>
    )   
}

export default function Page() {
    return (
        <div className="flex flex-col justify-center w-full gap-16 mb-4 py-8">
            <div className="flex flex-col justify-center items-center gap-12">
                <h1 className="text-[3.5rem] font-semibold">CONTACT US</h1>
                <div className="flex flex-row w-full h-[225px] gap-4 px-10">
                    <Card symbol="SYMBOL" title="Based out of:" content="Monmouth County, New Jersey" />
                    <Card symbol="SYMBOL" title="Phone:" content="+1 (732) 515-0892" />
                    <Card symbol="SYMBOL" title="Email:" content="forreelflies@gmail.com" />
                </div>
            </div>

            <div className="flex flex-col justify-center items-center gap-12 w-full">
                <h1 className="text-[3.5rem] font-semibold">SEND US A MESSAGE</h1>
                <form className="flex flex-col justify-center items-center gap-5 w-full px-64">
                    <Input className="h-[50px]" type="text" placeholder="Name"/>
                    <Input className="h-[50px]" type="email" placeholder="Email"/>
                    <Input className="h-[50px]" type="text" placeholder="Subject"/>
                    <Textarea placeholder="Message" />
                    <Button type="submit" text="SUBMIT" />
                </form>
            </div>

            
        </div>
    )
}