using Drop.Domain.Common;

namespace Drop.Domain.Businesses;

public sealed class BusinessDomainException : DomainException
{
    public BusinessDomainException(string code, string message)
        : base(code, message)
    {
    }
}
