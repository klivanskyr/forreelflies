'use client';

import { useState } from "react";
import IconButton from "../buttons/IconButton";
import SearchTopbar from "../Topbar/SearchTopbar";
import { IoSearchOutline as SearchIcon } from "react-icons/io5";


export default function NavSearchTopBar() {
    const [topbarOpen, setTopbarOpen] = useState<boolean>(false);

    return (
        <>
            <IconButton onClick={() => setTopbarOpen(prev => !prev)} icon={<SearchIcon className="w-[25px] h-[25px]" />}/>
            <SearchTopbar open={topbarOpen} setOpen={setTopbarOpen} />
        </>
    )
}