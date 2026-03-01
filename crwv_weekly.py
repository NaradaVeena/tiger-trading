import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# Fetch CRWV weekly data
ticker = yf.Ticker('CRWV')
end_date = datetime.now()
start_date = end_date - timedelta(weeks=104)  # 2 years of weekly data

df = ticker.history(period='2y', interval='1wk')

if df.empty:
    print('No data available')
else:
    # Print key levels
    print(f'CRWV Weekly Analysis')
    print(f'Current Price: ${df["Close"].iloc[-1]:.2f}')
    print(f'52W High: ${df["High"].max():.2f}')
    print(f'52W Low: ${df["Low"].min():.2f}')
    print(f'200W MA: ${df["Close"].rolling(20).mean().iloc[-1]:.2f}')
    print(f'50W MA: ${df["Close"].rolling(10).mean().iloc[-1]:.2f}')
    print(f'20W MA: ${df["Close"].rolling(5).mean().iloc[-1]:.2f}')
    print()
    print('Last 10 weeks:')
    for i, (idx, row) in enumerate(df.tail(10).iterrows()):
        print(f'{idx.date()}: O={row["Open"]:.2f} H={row["High"]:.2f} L={row["Low"]:.2f} C={row["Close"]:.2f} V={row["Volume"]:,.0f}')
