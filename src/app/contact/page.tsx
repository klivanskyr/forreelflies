export default function Page() {
    return (
        <div>
            <div>
                <h1>CONTACT US</h1>
                <div className="flex flex-row">
                    <div>
                        <p>SYMBOL</p>
                        <h2>Based out of:</h2>
                        <h2>Monmouth County, New Jersey</h2>
                    </div>
                    <div>
                        <p>SYMBOL</p>
                        <h2>Phone:</h2>
                        <h2>+1 (732) 515-0892</h2>
                    </div>
                    <div>
                        <p>SYMBOL</p>
                        <h2>Email:</h2>
                        <h2>forreelflies@gmail.com</h2>
                    </div>
                </div>
            </div>

            <div>
                <h1>SEND US A MESSAGE</h1>
                <div>
                    <form>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <input type="text" placeholder="Subject" />
                        <textarea placeholder="Message" />
                        <button type="submit">SUBMIT</button>
                    </form>
                </div>
            </div>

            
        </div>
    )
}