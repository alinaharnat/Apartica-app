import React from 'react'
import { Link } from 'react-router-dom'

const HotelCard = ({room, index}) => {
  return (
   <Link to={`/hotel/${room._id}`} className="flex flex-col gap-2 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
        <img
            src={room.images[0]} alt="" />
            <div>
                <p>
                    Hotel
                </p>
            </div>
   </Link>
  )
}

export default HotelCard