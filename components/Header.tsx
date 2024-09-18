import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white shadow-md">
      <Link
        href="/"
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
      >
        <span className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white transition-all">
          <Image
            width={100}
            height={100}
            id="logo-text"
            className="absolute h-3/4 w-3/4 p-[2px] md:h-[60%] md:w-[60%] md:p-0"
            alt="TinyTap Logo"
            src="/logo/text.svg"
            priority
          />
          <Image
            id="logo-circle"
            className="absolute h-full w-full transition-all duration-300 md:hover:rotate-180"
            alt=""
            src="/logo/circle.svg"
            fill
            priority
          />
        </span>
      </Link>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <Link href="/dictation" className="text-gray-600 hover:text-gray-900">
              Create Dictation
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}