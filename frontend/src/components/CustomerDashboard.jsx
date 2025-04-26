import React from "react";
import { useCustomers } from "../context/CustomerContext";

const CustomerDashboard = () => {
  const { customers, loading } = useCustomers();


//by geography
  const byGeography = () => {
    const cnt = {};
    customers.forEach(c => {
      const k = c.country || "Unknown";
      cnt[k] = (cnt[k] || 0) + 1;
    });
    return Object.entries(cnt)
      .sort((a,b) => b[1]-a[1])
      .slice(0,10)
      .map(([country, count]) => ({ country, count }));
  };


  //by sales volume

  const bySales = () =>
    [...customers]
      .sort((a,b) => (b.salesVolume||0)-(a.salesVolume||0))
      .slice(0,10)
      .map(c => ({ name: c.name, salesVolume: c.salesVolume }));


      //by product
  const byProduct = () => {
    const cnt = {};
    customers.forEach(c => {
      const p = c.mostPurchasedProduct || "Unknown";
      cnt[p] = (cnt[p] || 0) + 1;
    });
    return Object.entries(cnt)
      .sort((a,b) => b[1]-a[1])
      .slice(0,10)
      .map(([product, count]) => ({ product, count }));
  };

  if (loading) return <p>Loading…</p>;

  const geo = byGeography();
  const sales = bySales();
  const prod = byProduct();

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>

      <section>
        <h3>By Geography</h3>
        <ul>
          {geo.map((x,i) => <li key={i}>{x.country}: {x.count}</li>)}
        </ul>
      </section>

      <section>
        <h3>By Sales Volume</h3>
        <ul>
          {sales.map((x,i) => (
            <li key={i}>{x.name}: ${x.salesVolume?.toLocaleString()}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>By Product</h3>
        <ul>
          {prod.map((x,i) => <li key={i}>{x.product}: {x.count}</li>)}
        </ul>
      </section>
    </div>
  );
};

export default CustomerDashboard;
