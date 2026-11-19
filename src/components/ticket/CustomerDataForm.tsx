import React from 'react';

interface CustomerDataFormProps {
  customerName: string;
  phone: string;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
}

export const CustomerDataForm: React.FC<CustomerDataFormProps> = ({ customerName, phone, onNameChange, onPhoneChange }) => {
  return (
    <>
      <h2 className='mb-3 font-bold text-[10px] text-sky-600 uppercase tracking-widest'>👤 Data Pemesan</h2>
      <div className='space-y-3 bg-zinc-50 mb-6 p-4 border border-zinc-200 rounded-xl'>
        <div>
          <label className='block mb-1 font-bold text-[10px] text-zinc-500'>NAMA LENGKAP</label>
          <input required type='text' value={customerName} onChange={(e) => onNameChange(e.target.value)} placeholder='Budi Santoso' className='bg-white p-3 border border-zinc-200 focus:border-sky-500 rounded-xl outline-none ring-0 focus:ring-2 focus:ring-sky-500/20 w-full font-medium text-zinc-900 transition-all' />
        </div>
        <div>
          <label className='block mb-1 font-bold text-[10px] text-zinc-500'>NO. WHATSAPP (Wajib)</label>
          <div className='flex'>
            <span className='inline-flex items-center bg-zinc-100 px-3 border border-zinc-200 border-r-0 rounded-l-xl font-medium text-zinc-500'>+62</span>
            <input required type='tel' pattern='[0-9]{9,15}' value={phone} onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))} placeholder='812xxxxxxxx' className='flex-1 bg-white p-3 border border-zinc-200 focus:border-sky-500 rounded-r-xl outline-none ring-0 focus:ring-2 focus:ring-sky-500/20 font-medium text-zinc-900 transition-all' />
          </div>
        </div>
      </div>
    </>
  );
};
