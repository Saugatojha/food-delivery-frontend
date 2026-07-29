import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/mock'
import { useToast } from '../../context/ToastContext'
import api from '../../api/client'

export default function MenuManagement() {
  const { showToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', desc: '' })

  useEffect(() => {
    api.get('/owner/menu').then(({ data }) => {
      setItems(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const addItem = async (e) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price) return showToast('Name and price required', 'error')
    try {
      const { data } = await api.post('/owner/menu', { name: newItem.name, price: Number(newItem.price), desc: newItem.desc })
      setItems(prev => [...prev, data])
      setNewItem({ name: '', price: '', desc: '' })
      setShowForm(false)
      showToast('Item added to menu', 'success')
    } catch {
      showToast('Failed to add item', 'error')
    }
  }

  const deleteItem = async (id) => {
    try {
      await api.delete(`/owner/menu/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Item removed', 'success')
    } catch {
      showToast('Failed to delete item', 'error')
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto p-6 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm">
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addItem} className="border rounded-lg p-4 mb-4 bg-gray-50 grid gap-3 sm:grid-cols-4">
          <input className="border p-2 rounded text-sm" placeholder="Name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} required />
          <input className="border p-2 rounded text-sm" type="number" placeholder="Price (Rs)" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} required />
          <input className="border p-2 rounded text-sm" placeholder="Description" value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} />
          <button type="submit" className="bg-green-600 text-white p-2 rounded text-sm">Add</button>
        </form>
      )}

      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              {item.desc && <p className="text-sm text-gray-500">{item.desc}</p>}
              <p className="text-orange-600 font-medium text-sm mt-1">{formatPrice(item.price)}</p>
            </div>
            <button onClick={() => deleteItem(item.id)} className="text-red-500 text-sm hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
