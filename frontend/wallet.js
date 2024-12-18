import React, { useState } from "react";

function Wallet() {
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState("");

    const handleAddMoney = async () => {
        const response = await fetch(`/api/users/balance/<user_id>`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: parseInt(amount) }),
        });
        const data = await response.json();
        setBalance(data.balance);
    };

    return (
        <div>
            <h1>Digital Wallet</h1>
            <p>Current Balance: {balance}</p>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
            />
            <button onClick={handleAddMoney}>Add Money</button>
        </div>
    );
}

export default Wallet;
