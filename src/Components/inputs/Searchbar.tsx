import { IoSearchOutline } from "react-icons/io5";
import IconButton from "../buttons/IconButton";


interface SearchbarProps {
    value?: string;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    label?: string;
    classNames?: {
        form?: string;
        input?: string;
    };
  }

export default function Searchbar({ classNames={ form: "", input: "" }, placeholder="", onChange=() => {}, onSubmit=() => {} }: SearchbarProps ) {
    return (
        <form 
            className={`${classNames.form} flex flex-row justify-between w-full border-b-[0.1rem] border-black pb-1 gap-2`}
            onSubmit={onSubmit}
        >
            <input
                className={`${classNames.input} outline-none w-full`}
                placeholder={placeholder}
                onChange={onChange}
            />
            <IconButton className="!p-0" icon={<IoSearchOutline className="w-[25px] h-[25px]" />}/>
        </form>
    )
}