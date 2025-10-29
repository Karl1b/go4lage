import { useState, useEffect, useRef } from 'react'
import { OrganizationT } from '../util/types'
import OrganizationCard from './OrganizationCard'

export default function OrganizationCardContainer({ showData }: { showData: OrganizationT[] }) {
  const [displayedItems, setDisplayedItems] = useState<OrganizationT[]>([])
  
  const loaderRef = useRef(null)
  const ITEMS_PER_PAGE = 20

  // Initialize first page
  useEffect(() => {
    setDisplayedItems(showData.slice(0, ITEMS_PER_PAGE))
  }, [showData])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && displayedItems.length < showData.length) {
          // Calculate next page items
          const nextItems = showData.slice(
            displayedItems.length,
            displayedItems.length + ITEMS_PER_PAGE
          )
          setDisplayedItems(prev => [...prev, ...nextItems])
        }
      },
      {
        root: null,
        rootMargin: '20px',
        threshold: 0.1
      }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [displayedItems, showData])

  return (
    <div className="w-full">
      {displayedItems.map((organization: OrganizationT, index: number) => (
        <div key={`${organization.organization_name}-${index}`} className="w-full">
          <OrganizationCard organization={organization} />
        </div>
      ))}
      
      {/* Loading indicator and sentinel element */}
      {displayedItems.length < showData.length && (
        <div 
          ref={loaderRef}
          className="w-full p-4 flex justify-center"
        >
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}