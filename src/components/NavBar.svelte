<div class=" fixed bottom-0 bg-[#ff00ff] h-12 w-full z-50 flex flex-row gap-20 justify-center items-center border-t-[0.0125rem] border-t-[#111]">
    <button 
        type="button"
        on:click={() => {
            window.history.back();
        }}
    ><i class="fa-solid fa-arrow-left text-2xl"></i></button>
    <button class="border-2 border-white h-7 w-7 flex justify-center items-center font-[500] text-xl" 
        on:click={() => {
            window.location.href = '/';
        }}
    ><p>U</p></button>
    <button><i class="fa-solid fa-magnifying-glass text-2xl"></i></button>
</div>