import mysql.connector
import re

def read_payment_file(filename):
    data = {}

    with open(filename, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if ":" in line and "====" not in line:
                key, value = line.split(":", 1)
                data[key.strip()] = value.strip()

    return data


# Read file
payment_data = read_payment_file("payment_details.txt")

amount = payment_data["Amount"].replace("₹", "").strip()
order_id = payment_data["Order ID"]
receiver_upi = payment_data["Receiver UPI"]
transaction_id = payment_data["UPI Transaction ID"]

print("Extracted:", amount, order_id, receiver_upi)