import React from 'react'

const Loader = () => {
  return (
    <div className='relative flex h-12 w-12'>
        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400"></div>
        <div className="relative inline-flex rounded-full h-12 w-12 bg-blue-600"></div>
    </div>
  )
}

export default Loader
