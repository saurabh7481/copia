import React, { useState } from 'react'
import axios from 'axios'

const App = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFile = (e) => {
    setFile(e.target.files[0])
  }

  const submitFileHandler = () => {
    if (loading) return
    if (!file) {
      setMessage('Choose a file first')
      return
    }
    setLoading(true)
    const data = new FormData()
    data.append('file', file, file.name)
    axios
      .post('http://localhost:8000/v1/file/upload', data, {
        onUploadProgress: (ProgressEvent) => {
          setLoading(
            Math.round((ProgressEvent.loaded / ProgressEvent.total) * 100)
          )
        },
      })
      .then((res) => {
        setFile(null)
        setMessage('Uploaded')
        setLoading(false)
        console.log(res.statusText)
      })
  }

  return (
    <div className='flex justi = usefy-center items-center h-screen bg-slate-300'>
      <div className='flex flex-col gap-8 items-center p-8 w-1/3 rounded-lg nm-flat-slate-300-xl'>
        <h1 className='text-3xl font-bold'>Copia</h1>
        <label className='flex flex-col items-center py-6 px-4 w-4/6 tracking-wide uppercase rounded-lg cursor-pointer nm-flat-slate-100-sm'>
          <svg
            className='w-8 h-8'
            fill='currentColor'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
          >
            <path d='M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z' />
          </svg>
          <span className='mt-2 text-base leading-normal'>Select a file</span>
          <input
            type='file'
            className='hidden'
            name='file'
            onChange={handleFile}
          />
          <button onClick={submitFileHandler}>Upload</button>
        </label>
        <p onClick={() => router.push('/login')}>
          <span className='underline cursor-pointer'>Login</span> or{' '}
          <span className='underline cursor-pointer'>Signup</span>
        </p>
      </div>
    </div>
  )
}

export default App
