const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #f4f6f9; padding: 20px; }
  .page { max-width: 794px; margin: 0 auto; background: #fff; position: relative; overflow: hidden; }
  .watermark {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 96px; font-weight: 800; letter-spacing: 8px; color: #0f172a; opacity: .07;
    transform: rotate(-28deg); pointer-events: none; z-index: 0;
  }
  .header {
    background: #0b1220; color: #fff; padding: 24px 32px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .header .logo img { height: 48px; width: auto; display: block; }
  .header .title { text-align: right; }
  .header h1 { font-size: 28px; letter-spacing: 3px; line-height: 1; }
  .header .code { font-size: 12px; color: #cbd5e1; margin-top: 6px; }
  .status {
    display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    background: #dcfce7; color: #15803d;
  }
  .status.borrador { background: #e2e8f0; color: #475569; }
  .status.anulada { background: #fee2e2; color: #b91c1c; }
  .blocks { display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 16px; padding: 20px 32px; }
  .block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #15803d; margin-bottom: 6px; }
  .block p { font-size: 11px; color: #334155; line-height: 1.5; }
  .block .strong { font-weight: 700; font-size: 12px; color: #0f172a; }
  .items { width: calc(100% - 64px); margin: 0 32px; border-collapse: collapse; }
  .items thead th {
    background: #f1f5f9; color: #475569; font-size: 9px; text-transform: uppercase;
    letter-spacing: .06em; padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0;
  }
  .items tbody td { font-size: 11px; padding: 8px; border-bottom: 1px solid #eef2f6; color: #334155; }
  .items tbody tr:nth-child(even) td { background: #f8fafc; }
  .right { text-align: right; }
  .bottom { display: flex; gap: 24px; padding: 20px 32px; }
  .notes { flex: 1; }
  .notes h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #15803d; margin-bottom: 6px; }
  .notes p { font-size: 11px; color: #475569; line-height: 1.5; }
  .totals { width: 300px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #eef2f6; }
  .row.grand { background: #15803d; color: #fff; border: 0; border-radius: 6px; padding: 10px 12px; margin-top: 6px; font-size: 15px; font-weight: 700; }
  .signatures { display: flex; gap: 48px; padding: 26px 32px 8px; }
  .signatures div { flex: 1; text-align: center; }
  .signatures span { display: block; border-top: 1px solid #94a3b8; margin-bottom: 6px; height: 30px; }
  .signatures p { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; }
  .footer { padding: 10px 32px 22px; text-align: center; font-size: 10px; color: #94a3b8; }
  @media print { body { background: #fff; padding: 0; } .page { max-width: 100%; } }
`;
export default css;
